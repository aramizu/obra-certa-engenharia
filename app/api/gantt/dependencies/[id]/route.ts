import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { taskDependencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MISSING_TASK_ERROR } from "@/lib/domain-data";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { assertTaskWritable, getOwnedTask, projectResolveResponse } from "@/lib/user-tasks";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [dependency] = await db.select().from(taskDependencies).where(eq(taskDependencies.id, id)).limit(1);
    if (!dependency) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    const task = await getOwnedTask(dependency.taskId, user.id);
    if (!task) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    const writable = await assertTaskWritable(task, user.id);
    const writeError = projectResolveResponse(writable);
    if (writeError) return writeError;

    await db.delete(taskDependencies).where(eq(taskDependencies.id, id));
    revalidateDomainPages({ userId: user.id, projectId: task.projectId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir dependência" }, { status: 500 });
  }
}
