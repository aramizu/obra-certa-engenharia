import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { MISSING_COLUMN_ERROR, MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { getColumnOnProject } from "@/lib/owned-refs";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { isTaskColorId, parseTaskColorInput } from "@/lib/task-color";

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
    if (isProjectArchived(project)) return archivedWriteResponse();

    const { title, description, taskType, dueDate, startDate, assignee, columnId, isMilestone, color } = await request.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
    }

    let statusColumnId: string | null = emptyToNull(columnId);
    if (statusColumnId) {
      const column = await getColumnOnProject(statusColumnId, projectId);
      if (!column) return NextResponse.json({ error: MISSING_COLUMN_ERROR }, { status: 400 });
    }

    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${tasks.orderInColumn}), -1)` })
      .from(tasks)
      .where(
        statusColumnId
          ? and(eq(tasks.projectId, projectId), eq(tasks.statusColumnId, statusColumnId))
          : eq(tasks.projectId, projectId)
      );

    const parsedColor = parseTaskColorInput(color, "create");
    if (color != null && color !== "" && !isTaskColorId(color)) {
      return NextResponse.json({ error: "Cor inválida" }, { status: 400 });
    }

    const [task] = await db.insert(tasks).values({
      projectId,
      title: title.trim(),
      description: emptyToNull(description),
      taskType: taskType || "task",
      dueDate: emptyToNull(dueDate),
      startDate: emptyToNull(startDate),
      assignee: emptyToNull(assignee),
      isMilestone: Boolean(isMilestone),
      color: parsedColor ?? null,
      statusColumnId,
      orderInColumn: (maxOrder[0]?.max ?? -1) + 1,
    }).returning();

    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Erro ao criar tarefa" }, { status: 500 });
  }
}
