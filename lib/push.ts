import { addDays, formatISODate, parseISODate } from "@/lib/date";

export const PUSH_KINDS = ["today", "tomorrow", "overdue"] as const;
export type PushKind = (typeof PUSH_KINDS)[number];

export const DEFAULT_NOTIFY_HOUR = 8;
export const NOTIFY_WHEN_VALUES = ["due_day", "day_before", "both"] as const;
export type NotifyWhen = (typeof NOTIFY_WHEN_VALUES)[number];

export type DuePushCounts = {
  today: number;
  overdue: number;
  tomorrow: number;
};

export type DuePushItem = {
  taskId: string;
  kind: PushKind;
};

export type NotificationPrefs = {
  notifyHour: number;
  notifyOnDueDay: boolean;
  notifyDayBefore: boolean;
  notifyOverdue: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  notifyHour: DEFAULT_NOTIFY_HOUR,
  notifyOnDueDay: true,
  notifyDayBefore: true,
  notifyOverdue: true,
};

export const NOTIFY_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, "0")}:00`,
}));

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim()
  );
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
}

export function getCronSecret() {
  return process.env.CRON_SECRET?.trim() || null;
}

export function tomorrowIsoFrom(todayIso: string) {
  return formatISODate(addDays(parseISODate(todayIso), 1));
}

export function kindForDueDate(dueIso: string, todayIso: string): PushKind | null {
  if (dueIso === todayIso) return "today";
  if (dueIso === tomorrowIsoFrom(todayIso)) return "tomorrow";
  if (dueIso < todayIso) return "overdue";
  return null;
}

export function summarizeDuePush(counts: DuePushCounts): string | null {
  const today = counts.today;
  const overdue = counts.overdue;
  const tomorrow = counts.tomorrow;
  if (today <= 0 && overdue <= 0 && tomorrow <= 0) return null;

  const parts: string[] = [];
  if (today > 0 || overdue > 0) {
    const bits: string[] = [];
    if (today > 0) bits.push(today === 1 ? "1 vence" : `${today} vencem`);
    if (overdue > 0) bits.push(overdue === 1 ? "1 atrasada" : `${overdue} atrasadas`);
    parts.push(`Hoje: ${bits.join(", ")}`);
  }
  if (tomorrow > 0) parts.push(`Amanhã: ${tomorrow}`);
  return parts.join(" · ");
}

export function countsFromItems(items: DuePushItem[]): DuePushCounts {
  return {
    today: items.filter((item) => item.kind === "today").length,
    overdue: items.filter((item) => item.kind === "overdue").length,
    tomorrow: items.filter((item) => item.kind === "tomorrow").length,
  };
}

export function filterUnsentDueItems(
  items: DuePushItem[],
  sentToday: Iterable<{ taskId: string; kind: string }>
) {
  const sent = new Set(
    Array.from(sentToday).map((row) => `${row.taskId}:${row.kind}`)
  );
  return items.filter((item) => !sent.has(`${item.taskId}:${item.kind}`));
}

export function isGonePushStatus(status: number | undefined | null) {
  return status === 404 || status === 410;
}

export function normalizeNotifyHour(value: unknown): number {
  const hour = Number(value);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return DEFAULT_NOTIFY_HOUR;
  return hour;
}

export function notifyWhenFromFlags(onDueDay: boolean, dayBefore: boolean): NotifyWhen {
  if (onDueDay && dayBefore) return "both";
  if (dayBefore && !onDueDay) return "day_before";
  return "due_day";
}

export function flagsFromNotifyWhen(when: NotifyWhen): Pick<NotificationPrefs, "notifyOnDueDay" | "notifyDayBefore"> {
  return {
    notifyOnDueDay: when === "due_day" || when === "both",
    notifyDayBefore: when === "day_before" || when === "both",
  };
}

export function applyNotifyPrefs(items: DuePushItem[], prefs: Pick<NotificationPrefs, "notifyOnDueDay" | "notifyDayBefore" | "notifyOverdue">) {
  return items.filter((item) => {
    if (item.kind === "today") return prefs.notifyOnDueDay;
    if (item.kind === "tomorrow") return prefs.notifyDayBefore;
    if (item.kind === "overdue") return prefs.notifyOverdue;
    return false;
  });
}

export function shouldSendAtHour(notifyHour: unknown, currentHour: number) {
  return normalizeNotifyHour(notifyHour) === currentHour;
}

export function prefsFromRow(row: Partial<NotificationPrefs> | null | undefined): NotificationPrefs {
  return {
    notifyHour: normalizeNotifyHour(row?.notifyHour),
    notifyOnDueDay: row?.notifyOnDueDay !== false,
    notifyDayBefore: row?.notifyDayBefore !== false,
    notifyOverdue: row?.notifyOverdue !== false,
  };
}
