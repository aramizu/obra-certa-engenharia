import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, taskDependencies, tasks } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { wouldCreateCycle } from "@/lib/gantt";

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await params;
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).limit(1);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { taskId, dependsOnTaskId } = await request.json();
    if (!taskId || !dependsOnTaskId) {
      return NextResponse.json({ error: "Dependência inválida" }, { status: 400 });
    }
    if (taskId === dependsOnTaskId) {
      return NextResponse.json({ error: "Uma tarefa não pode depender de si mesma" }, { status: 400 });
    }

    const related = await db.select().from(tasks).where(and(
      eq(tasks.projectId, projectId),
      inArray(tasks.id, [taskId, dependsOnTaskId])
    ));
    if (related.length !== 2) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
    if (existing.some((dep) => dep.dependsOnTaskId === dependsOnTaskId)) {
      return NextResponse.json({ success: true, dependency: existing.find((dep) => dep.dependsOnTaskId === dependsOnTaskId) });
    }

    const projectTaskIds = (await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.projectId, projectId))).map((row) => row.id);
    const allDeps = projectTaskIds.length
      ? await db.select().from(taskDependencies).where(inArray(taskDependencies.taskId, projectTaskIds))
      : [];

    if (wouldCreateCycle(allDeps, taskId, dependsOnTaskId)) {
      return NextResponse.json({ error: "Essa dependência criaria um ciclo" }, { status: 400 });
    }

    const [dependency] = await db.insert(taskDependencies).values({ taskId, dependsOnTaskId }).returning();
    return NextResponse.json({ success: true, dependency });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
