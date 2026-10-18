import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { taskDependencies, tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { MISSING_OBRA_ERROR, MISSING_TASK_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { revalidateDomainPages } from "@/lib/revalidate-app";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });

    const [dependency] = await db.select().from(taskDependencies).where(eq(taskDependencies.id, id)).limit(1);
    if (!dependency) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, dependency.taskId), eq(tasks.projectId, projectId))).limit(1);
    if (!task) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    await db.delete(taskDependencies).where(eq(taskDependencies.id, id));
    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir dependência" }, { status: 500 });
  }
}
