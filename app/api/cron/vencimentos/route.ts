import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  pushSubscriptions,
  taskColumns,
  taskNotifications,
  tasks,
  users,
} from "@/lib/db/schema";
import { isDoneColumn } from "@/lib/calendar";
import { APP_TIME_ZONE, formatISODate, hourInTimeZone, todayInTimeZone } from "@/lib/date";
import {
  applyNotifyPrefs,
  countsFromItems,
  filterUnsentDueItems,
  getCronSecret,
  isGonePushStatus,
  isPushConfigured,
  kindForDueDate,
  prefsFromRow,
  shouldSendAtHour,
  summarizeDuePush,
  type DuePushItem,
} from "@/lib/push";
import { visibleUserTasksWhere } from "@/lib/user-tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function bearerMatches(header: string | null, secret: string) {
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length);
  const left = Buffer.from(token);
  const right = Buffer.from(secret);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  const cronSecret = getCronSecret();
  if (!cronSecret || !isPushConfigured()) {
    return NextResponse.json({ error: "Notificações push não configuradas" }, { status: 503 });
  }
  if (!bearerMatches(request.headers.get("authorization"), cronSecret)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY!.trim();
  const subject = process.env.VAPID_SUBJECT!.trim();

  const webpushModule = await import("web-push");
  const webpush = webpushModule.default ?? webpushModule;
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const now = new Date();
  const todayIso = formatISODate(todayInTimeZone(APP_TIME_ZONE, now));
  const currentHour = hourInTimeZone(APP_TIME_ZONE, now);
  const slot = request.nextUrl.searchParams.get("h");

  const subscriptions = await db.select().from(pushSubscriptions);
  const userIds = [...new Set(subscriptions.map((row) => row.userId))];
  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, hour: currentHour, slot, users: 0, removed: 0 });
  }

  const settingRows = await db
    .select({
      id: users.id,
      notifyHour: users.notifyHour,
      notifyOnDueDay: users.notifyOnDueDay,
      notifyDayBefore: users.notifyDayBefore,
      notifyOverdue: users.notifyOverdue,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  const settingsByUser = new Map(settingRows.map((row) => [row.id, prefsFromRow(row)]));

  let notifiedUsers = 0;
  let removed = 0;

  for (const userId of userIds) {
    const prefs = settingsByUser.get(userId) ?? prefsFromRow(null);
    if (!shouldSendAtHour(prefs.notifyHour, currentHour)) continue;

    const userSubs = subscriptions.filter((row) => row.userId === userId);
    if (userSubs.length === 0) continue;

    const rows = await db
      .select({
        id: tasks.id,
        dueDate: tasks.dueDate,
        endDate: tasks.endDate,
        columnName: taskColumns.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(taskColumns, eq(tasks.statusColumnId, taskColumns.id))
      .where(visibleUserTasksWhere(userId));

    const items: DuePushItem[] = [];
    for (const row of rows) {
      if (isDoneColumn(row.columnName)) continue;
      const dueIso = row.dueDate || row.endDate;
      if (!dueIso) continue;
      const kind = kindForDueDate(dueIso, todayIso);
      if (!kind) continue;
      items.push({ taskId: row.id, kind });
    }

    const preferred = applyNotifyPrefs(items, prefs);
    if (preferred.length === 0) continue;

    const taskIds = [...new Set(preferred.map((item) => item.taskId))];
    const sentToday = await db
      .select({
        taskId: taskNotifications.taskId,
        kind: taskNotifications.kind,
      })
      .from(taskNotifications)
      .where(and(inArray(taskNotifications.taskId, taskIds), eq(taskNotifications.sentOn, todayIso)));

    const pending = filterUnsentDueItems(preferred, sentToday);
    const body = summarizeDuePush(countsFromItems(pending));
    if (!body) continue;

    const payload = JSON.stringify({
      title: "Obra Certa Engenharia",
      body,
      url: "/kanban",
    });

    let delivered = 0;
    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          { TTL: 60 * 60 * 12 }
        );
        delivered += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (isGonePushStatus(status)) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          removed += 1;
        }
      }
    }

    if (delivered === 0) continue;

    await db
      .insert(taskNotifications)
      .values(
        pending.map((item) => ({
          taskId: item.taskId,
          kind: item.kind,
          sentOn: todayIso,
        }))
      )
      .onConflictDoNothing();

    notifiedUsers += 1;
  }

  return NextResponse.json({ ok: true, hour: currentHour, slot, users: notifiedUsers, removed });
}
