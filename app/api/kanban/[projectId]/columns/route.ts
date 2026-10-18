import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { taskColumns } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { revalidateDomainPages } from "@/lib/revalidate-app";

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    if (isProjectArchived(project)) return archivedWriteResponse();

    const { name } = await request.json();
    const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(${taskColumns.order}), -1)` }).from(taskColumns).where(eq(taskColumns.projectId, projectId));
    
    const [column] = await db.insert(taskColumns).values({
      projectId,
      name,
      order: (maxOrder[0]?.max ?? -1) + 1,
    }).returning();

    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true, column });
  } catch {
    return NextResponse.json({ error: "Erro ao criar coluna" }, { status: 500 });
  }
}
