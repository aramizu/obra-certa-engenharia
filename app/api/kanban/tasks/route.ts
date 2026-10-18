import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { MISSING_COLUMN_ERROR } from "@/lib/domain-data";
import { getColumnOnUser } from "@/lib/owned-refs";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { isTaskColorId, parseTaskColorInput } from "@/lib/task-color";
import {
  emptyToNull,
  firstUserColumn,
  nextOrderInColumn,
  projectResolveResponse,
  resolveWritableProject,
} from "@/lib/user-tasks";

export async function POST(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, description, taskType, dueDate, startDate, assignee, columnId, color, projectId } = body;
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
    }

    const resolved = await resolveWritableProject(projectId, user.id);
    if (resolved.status !== "ok") return projectResolveResponse(resolved)!;

    let statusColumnId: string | null = emptyToNull(columnId);
    if (statusColumnId) {
      const column = await getColumnOnUser(statusColumnId, user.id);
      if (!column) return NextResponse.json({ error: MISSING_COLUMN_ERROR }, { status: 400 });
    } else {
      const first = await firstUserColumn(user.id);
      statusColumnId = first?.id ?? null;
    }

    if (color != null && color !== "" && !isTaskColorId(color)) {
      return NextResponse.json({ error: "Cor inválida" }, { status: 400 });
    }
    const parsedColor = parseTaskColorInput(color, "create");

    const [task] = await db.insert(tasks).values({
      userId: user.id,
      projectId: resolved.projectId,
      title: title.trim(),
      description: emptyToNull(description),
      taskType: taskType || "task",
      dueDate: emptyToNull(dueDate),
      startDate: emptyToNull(startDate),
      assignee: emptyToNull(assignee),
      color: parsedColor ?? null,
      statusColumnId,
      orderInColumn: await nextOrderInColumn(user.id, statusColumnId),
    }).returning();

    revalidateDomainPages({ userId: user.id, projectId: resolved.projectId });
    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Erro ao criar tarefa" }, { status: 500 });
  }
}
