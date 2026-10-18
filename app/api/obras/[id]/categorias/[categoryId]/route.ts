import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, budgetCategories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  budgetedAmount: z.string().optional(),
});

async function loadWritableProject(projectId: string, userId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: projectId, categoryId } = await params;

    const project = await loadWritableProject(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    }
    if (isProjectArchived(project)) return archivedWriteResponse();

    const body = await request.json();
    const data = categorySchema.parse(body);

    const [category] = await db
      .update(budgetCategories)
      .set({
        name: data.name,
        budgetedAmount: data.budgetedAmount || "0",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(budgetCategories.id, categoryId),
          eq(budgetCategories.projectId, projectId)
        )
      )
      .returning();

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true, category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: projectId, categoryId } = await params;

    const project = await loadWritableProject(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    }
    if (isProjectArchived(project)) return archivedWriteResponse();

    const [category] = await db
      .delete(budgetCategories)
      .where(
        and(
          eq(budgetCategories.id, categoryId),
          eq(budgetCategories.projectId, projectId)
        )
      )
      .returning();

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Erro ao excluir categoria" },
      { status: 500 }
    );
  }
}
