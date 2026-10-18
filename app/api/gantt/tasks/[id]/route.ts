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
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.title === "string") {
      if (!body.title.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
      updates.title = body.title.trim();
    }
    if ("description" in body) updates.description = emptyToNull(body.description);
    if ("assignee" in body) updates.assignee = emptyToNull(body.assignee);
    if ("color" in body) {
      if (body.color != null && body.color !== "" && !isTaskColorId(body.color)) {
        return NextResponse.json({ error: "Cor inválida" }, { status: 400 });
      }
      const parsedColor = parseTaskColorInput(body.color, "patch");
      if (parsedColor !== undefined) updates.color = parsedColor;
    }
    if ("projectId" in body) {
      const resolved = await resolveWritableProject(body.projectId, user.id);
      if (resolved.status !== "ok") return projectResolveResponse(resolved)!;
      updates.projectId = resolved.projectId;
    }

    const start = "startDate" in body ? emptyToNull(body.startDate) : undefined;
    const due = "dueDate" in body ? emptyToNull(body.dueDate) : undefined;

    if (start !== undefined) updates.startDate = start;
    if (due !== undefined) {
      updates.dueDate = due;
      updates.endDate = due;
    }

    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .returning();
    if (!task) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    revalidateDomainPages({ userId: user.id, projectId: task.projectId ?? existing.projectId });
    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar tarefa" }, { status: 500 });
  }
}
