import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { MISSING_OBRA_ERROR, MISSING_TASK_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { revalidateDomainPages } from "@/lib/revalidate-app";

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
    const project = await getOwnedProject(projectId, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.title === "string") {
      if (!body.title.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
      updates.title = body.title.trim();
    }
    if ("description" in body) updates.description = emptyToNull(body.description);
    if ("assignee" in body) updates.assignee = emptyToNull(body.assignee);
    if ("isMilestone" in body) updates.isMilestone = Boolean(body.isMilestone);

    const milestone = "isMilestone" in body ? Boolean(body.isMilestone) : undefined;
    let start = "startDate" in body ? emptyToNull(body.startDate) : undefined;
    let due = "dueDate" in body ? emptyToNull(body.dueDate) : undefined;

    if (milestone === true) {
      const point = due || start;
      start = point;
      due = point;
    }

    if (start !== undefined) updates.startDate = start;
    if (due !== undefined) {
      updates.dueDate = due;
      updates.endDate = due;
    }

    const [task] = await db.update(tasks).set(updates).where(and(eq(tasks.id, id), eq(tasks.projectId, projectId))).returning();
    if (!task) return NextResponse.json({ error: MISSING_TASK_ERROR }, { status: 404 });

    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true, task });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar tarefa" }, { status: 500 });
  }
}
