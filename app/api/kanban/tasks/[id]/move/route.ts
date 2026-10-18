import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { MISSING_COLUMN_ERROR, MISSING_TASK_ERROR } from "@/lib/domain-data";
import { getColumnOnUser } from "@/lib/owned-refs";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { assertTaskWritable, getOwnedTask, projectResolveResponse } from "@/lib/user-tasks";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const task = await getOwnedTask(id, user.id);
    if (!task) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    const writable = await assertTaskWritable(task, user.id);
    const writeError = projectResolveResponse(writable);
    if (writeError) return writeError;

    const { columnId, orderInColumn } = await request.json();
    if (!columnId || typeof columnId !== "string") {
      return NextResponse.json({ error: "Coluna obrigatória" }, { status: 400 });
    }

    const column = await getColumnOnUser(columnId, user.id);
    if (!column) return NextResponse.json({ error: MISSING_COLUMN_ERROR }, { status: 404 });

    const destTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), eq(tasks.statusColumnId, columnId)))
      .orderBy(tasks.orderInColumn);

    const ordered = destTasks.filter((item) => item.id !== id);
    const index = Math.max(0, Math.min(Number(orderInColumn ?? ordered.length), ordered.length));
    ordered.splice(index, 0, task);

    for (let i = 0; i < ordered.length; i++) {
      await db.update(tasks).set({
        statusColumnId: columnId,
        orderInColumn: i,
        updatedAt: new Date(),
      }).where(and(eq(tasks.id, ordered[i].id), eq(tasks.userId, user.id)));
    }

    revalidateDomainPages({ userId: user.id, projectId: task.projectId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao mover tarefa" }, { status: 500 });
  }
}
