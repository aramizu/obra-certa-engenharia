import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, taskColumns } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getOwnedProject(projectId: string, userId: string) {
  const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
  return project ?? null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [column] = await db.select().from(taskColumns).where(and(eq(taskColumns.id, id), eq(taskColumns.projectId, projectId))).limit(1);
    if (!column) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { name, direction } = await request.json();

    if (typeof name === "string" && name.trim()) {
      await db.update(taskColumns).set({ name: name.trim(), updatedAt: new Date() }).where(and(eq(taskColumns.id, id), eq(taskColumns.projectId, projectId)));
    }

    if (direction === "left" || direction === "right") {
      const columns = await db.select().from(taskColumns).where(eq(taskColumns.projectId, projectId)).orderBy(taskColumns.order);
      const index = columns.findIndex((item) => item.id === id);
      const swapIndex = direction === "left" ? index - 1 : index + 1;
      if (index >= 0 && swapIndex >= 0 && swapIndex < columns.length) {
        const current = columns[index];
        const neighbor = columns[swapIndex];
        columns[index] = neighbor;
        columns[swapIndex] = current;
        for (let i = 0; i < columns.length; i++) {
          await db.update(taskColumns).set({ order: i, updatedAt: new Date() }).where(and(eq(taskColumns.id, columns[i].id), eq(taskColumns.projectId, projectId)));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ projectId: string; id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, id } = await params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const columns = await db.select().from(taskColumns).where(eq(taskColumns.projectId, projectId));
    if (columns.length <= 1) {
      return NextResponse.json({ error: "Não é possível excluir a última coluna" }, { status: 400 });
    }

    await db.delete(taskColumns).where(and(eq(taskColumns.id, id), eq(taskColumns.projectId, projectId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
