import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, taskDependencies, tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).limit(1);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [dependency] = await db.select().from(taskDependencies).where(eq(taskDependencies.id, id)).limit(1);
    if (!dependency) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, dependency.taskId), eq(tasks.projectId, projectId))).limit(1);
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(taskDependencies).where(eq(taskDependencies.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
