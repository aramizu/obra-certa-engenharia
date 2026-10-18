import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { taskColumns, tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { MISSING_COLUMN_ERROR, MISSING_OBRA_ERROR, MISSING_TASK_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { revalidateDomainPages } from "@/lib/revalidate-app";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    if (isProjectArchived(project)) return archivedWriteResponse();

    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.projectId, projectId))).limit(1);
    if (!task) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    const { columnId, orderInColumn } = await request.json();
    if (!columnId || typeof columnId !== "string") {
      return NextResponse.json({ error: "Coluna obrigatória" }, { status: 400 });
    }

    const [column] = await db.select().from(taskColumns).where(and(eq(taskColumns.id, columnId), eq(taskColumns.projectId, projectId))).limit(1);
    if (!column) return NextResponse.json({ error: MISSING_COLUMN_ERROR }, { status: 404 });

    const destTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.statusColumnId, columnId)))
      .orderBy(tasks.orderInColumn);

    const ordered = destTasks.filter((item) => item.id !== id);
    const index = Math.max(0, Math.min(Number(orderInColumn ?? ordered.length), ordered.length));
    ordered.splice(index, 0, task);

    for (let i = 0; i < ordered.length; i++) {
      await db.update(tasks).set({
        statusColumnId: columnId,
        orderInColumn: i,
        updatedAt: new Date(),
      }).where(and(eq(tasks.id, ordered[i].id), eq(tasks.projectId, projectId)));
    }

    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao mover tarefa" }, { status: 500 });
  }
}
