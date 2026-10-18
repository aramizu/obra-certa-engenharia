import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { MISSING_OBRA_ERROR, MISSING_TASK_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { isTaskColorId, parseTaskColorInput } from "@/lib/task-color";

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    if (isProjectArchived(project)) return archivedWriteResponse();

    const { title, description, taskType, dueDate, startDate, assignee, isMilestone, color } = await request.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
    }

    if (color != null && color !== "" && !isTaskColorId(color)) {
      return NextResponse.json({ error: "Cor inválida" }, { status: 400 });
    }
    const parsedColor = parseTaskColorInput(color, "patch");

    const [task] = await db.update(tasks).set({
      title: title.trim(),
      description: emptyToNull(description),
      taskType: taskType || "task",
      dueDate: emptyToNull(dueDate),
      startDate: emptyToNull(startDate),
      assignee: emptyToNull(assignee),
      isMilestone: Boolean(isMilestone),
      ...(parsedColor !== undefined ? { color: parsedColor } : {}),
      updatedAt: new Date(),
    }).where(and(eq(tasks.id, id), eq(tasks.projectId, projectId))).returning();

    if (!task) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar tarefa" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    if (isProjectArchived(project)) return archivedWriteResponse();

    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.projectId, projectId)))
      .returning();
    if (!deleted) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });
    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir tarefa" }, { status: 500 });
  }
}
