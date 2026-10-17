import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).limit(1);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { title, description, taskType, dueDate, startDate, assignee } = await request.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
    }

    const [task] = await db.update(tasks).set({
      title: title.trim(),
      description: emptyToNull(description),
      taskType: taskType || "task",
      dueDate: emptyToNull(dueDate),
      startDate: emptyToNull(startDate),
      assignee: emptyToNull(assignee),
      updatedAt: new Date(),
    }).where(and(eq(tasks.id, id), eq(tasks.projectId, projectId))).returning();

    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).limit(1);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.projectId, projectId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
