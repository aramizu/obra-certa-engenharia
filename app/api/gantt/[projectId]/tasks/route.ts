import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { taskColumns, tasks } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { revalidateDomainPages } from "@/lib/revalidate-app";

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });

    const { title, description, assignee, startDate, dueDate, isMilestone } = await request.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
    }

    const [column] = await db.select().from(taskColumns).where(eq(taskColumns.projectId, projectId)).orderBy(taskColumns.order).limit(1);
    const milestone = Boolean(isMilestone);
    const start = emptyToNull(startDate);
    const due = emptyToNull(dueDate);
    const point = due || start;

    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${tasks.orderInColumn}), -1)` })
      .from(tasks)
      .where(
        column
          ? and(eq(tasks.projectId, projectId), eq(tasks.statusColumnId, column.id))
          : eq(tasks.projectId, projectId)
      );

    const [task] = await db.insert(tasks).values({
      projectId,
      title: title.trim(),
      description: emptyToNull(description),
      assignee: emptyToNull(assignee),
      isMilestone: milestone,
      startDate: milestone ? point : start,
      dueDate: milestone ? point : due,
      endDate: milestone ? point : due,
      statusColumnId: column?.id ?? null,
      orderInColumn: (maxOrder[0]?.max ?? -1) + 1,
    }).returning();

    revalidateDomainPages(projectId);
    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Erro ao criar tarefa" }, { status: 500 });
  }
}
