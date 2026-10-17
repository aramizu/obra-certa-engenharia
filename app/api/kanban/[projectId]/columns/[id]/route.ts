import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, taskColumns } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).limit(1);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { name } = await request.json();
    const [column] = await db.update(taskColumns).set({ name, updatedAt: new Date() }).where(and(eq(taskColumns.id, id), eq(taskColumns.projectId, projectId))).returning();
    
    return NextResponse.json({ success: true, column });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id))).limit(1);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(taskColumns).where(and(eq(taskColumns.id, id), eq(taskColumns.projectId, projectId)));
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
