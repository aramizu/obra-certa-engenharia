import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await params;
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).limit(1);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { title, description, taskType, dueDate, columnId } = await request.json();
    const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(${tasks.orderInColumn}), -1)` }).from(tasks).where(and(eq(tasks.projectId, projectId), eq(tasks.statusColumnId, columnId)));
    
    const [task] = await db.insert(tasks).values({
      projectId,
      title,
      description,
      taskType: taskType || "task",
      dueDate,
      statusColumnId: columnId,
      orderInColumn: (maxOrder[0]?.max ?? -1) + 1,
    }).returning();

    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
