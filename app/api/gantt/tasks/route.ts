import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
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

    const { title, description, assignee, startDate, dueDate, color, projectId } = await request.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
    }

    const resolved = await resolveWritableProject(projectId, user.id);
    if (resolved.status !== "ok") return projectResolveResponse(resolved)!;

    const column = await firstUserColumn(user.id);
    const start = emptyToNull(startDate);
    const due = emptyToNull(dueDate);

    if (color != null && color !== "" && !isTaskColorId(color)) {
      return NextResponse.json({ error: "Cor inválida" }, { status: 400 });
    }
    const parsedColor = parseTaskColorInput(color, "create");

    const [task] = await db.insert(tasks).values({
      userId: user.id,
      projectId: resolved.projectId,
      title: title.trim(),
      description: emptyToNull(description),
      assignee: emptyToNull(assignee),
      color: parsedColor ?? null,
      startDate: start,
      dueDate: due,
      endDate: due,
      statusColumnId: column?.id ?? null,
      orderInColumn: await nextOrderInColumn(user.id, column?.id ?? null),
    }).returning();

    revalidateDomainPages({ userId: user.id, projectId: resolved.projectId });
    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Erro ao criar tarefa" }, { status: 500 });
  }
}
