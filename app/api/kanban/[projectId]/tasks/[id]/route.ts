import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).limit(1);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { title, description, taskType, dueDate } = await request.json();
    const [task] = await db.update(tasks).set({ title, description, taskType, dueDate, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.projectId, projectId))).returning();
    
    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
