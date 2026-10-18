import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { MISSING_TASK_ERROR } from "@/lib/domain-data";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { isTaskColorId, parseTaskColorInput } from "@/lib/task-color";
import {
  assertTaskWritable,
  emptyToNull,
  getOwnedTask,
  projectResolveResponse,
  resolveWritableProject,
} from "@/lib/user-tasks";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await getOwnedTask(id, user.id);
    if (!existing) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    const writable = await assertTaskWritable(existing, user.id);
    const writeError = projectResolveResponse(writable);
    if (writeError) return writeError;

    const body = await request.json();
    const { title, description, taskType, dueDate, startDate, assignee, color } = body;
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
    }

    if (color != null && color !== "" && !isTaskColorId(color)) {
      return NextResponse.json({ error: "Cor inválida" }, { status: 400 });
    }
    const parsedColor = parseTaskColorInput(color, "patch");

    let nextProjectId = existing.projectId;
    if ("projectId" in body) {
      const resolved = await resolveWritableProject(body.projectId, user.id);
      if (resolved.status !== "ok") return projectResolveResponse(resolved)!;
      nextProjectId = resolved.projectId;
    }

    const [task] = await db.update(tasks).set({
      projectId: nextProjectId,
      title: title.trim(),
      description: emptyToNull(description),
      taskType: taskType || "task",
      dueDate: emptyToNull(dueDate),
      startDate: emptyToNull(startDate),
      assignee: emptyToNull(assignee),
      ...(parsedColor !== undefined ? { color: parsedColor } : {}),
      updatedAt: new Date(),
    }).where(and(eq(tasks.id, id), eq(tasks.userId, user.id))).returning();

    if (!task) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    revalidateDomainPages({ userId: user.id, projectId: task.projectId ?? existing.projectId });
    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar tarefa" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await getOwnedTask(id, user.id);
    if (!existing) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    const writable = await assertTaskWritable(existing, user.id);
    const writeError = projectResolveResponse(writable);
    if (writeError) return writeError;

    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .returning();
    if (!deleted) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });
    revalidateDomainPages({ userId: user.id, projectId: existing.projectId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir tarefa" }, { status: 500 });
  }
}
