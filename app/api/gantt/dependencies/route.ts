import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { taskDependencies, tasks } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { wouldCreateCycle } from "@/lib/gantt";
import { MISSING_TASK_ERROR } from "@/lib/domain-data";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { assertTaskWritable, getOwnedTask, projectResolveResponse } from "@/lib/user-tasks";

export async function POST(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId, dependsOnTaskId } = await request.json();
    if (!taskId || !dependsOnTaskId) {
      return NextResponse.json({ error: "Dependência inválida" }, { status: 400 });
    }
    if (taskId === dependsOnTaskId) {
      return NextResponse.json({ error: "Uma tarefa não pode depender de si mesma" }, { status: 400 });
    }

    const related = await db.select().from(tasks).where(and(
      eq(tasks.userId, user.id),
      inArray(tasks.id, [taskId, dependsOnTaskId])
    ));
    if (related.length !== 2) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    for (const task of related) {
      const writable = await assertTaskWritable(task, user.id);
      const writeError = projectResolveResponse(writable);
      if (writeError) return writeError;
    }

    const existing = await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
    if (existing.some((dep) => dep.dependsOnTaskId === dependsOnTaskId)) {
      return NextResponse.json({ success: true, dependency: existing.find((dep) => dep.dependsOnTaskId === dependsOnTaskId) });
    }

    const userTaskIds = (await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, user.id))).map((row) => row.id);
    const allDeps = userTaskIds.length
      ? await db.select().from(taskDependencies).where(inArray(taskDependencies.taskId, userTaskIds))
      : [];

    if (wouldCreateCycle(allDeps, taskId, dependsOnTaskId)) {
      return NextResponse.json({ error: "Essa dependência criaria um ciclo" }, { status: 400 });
    }

    const [dependency] = await db.insert(taskDependencies).values({ taskId, dependsOnTaskId }).returning();
    const owner = await getOwnedTask(taskId, user.id);
    revalidateDomainPages({ userId: user.id, projectId: owner?.projectId });
    return NextResponse.json({ success: true, dependency });
  } catch {
    return NextResponse.json({ error: "Erro ao criar dependência" }, { status: 500 });
  }
}
