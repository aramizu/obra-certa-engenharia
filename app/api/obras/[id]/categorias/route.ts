import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, budgetCategories } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  budgetedAmount: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const data = categorySchema.parse(body);

    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${budgetCategories.order}), -1)` })
      .from(budgetCategories)
      .where(eq(budgetCategories.projectId, projectId));

    const [category] = await db
      .insert(budgetCategories)
      .values({
        projectId,
        name: data.name,
        budgetedAmount: data.budgetedAmount || "0",
        order: (maxOrder[0]?.max ?? -1) + 1,
      })
      .returning();

    return NextResponse.json({ success: true, category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}
