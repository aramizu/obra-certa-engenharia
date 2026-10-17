import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, budgetCategories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";

export async function GET(
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
      return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    }

    const categories = await db
      .select({
        id: budgetCategories.id,
        name: budgetCategories.name,
      })
      .from(budgetCategories)
      .where(eq(budgetCategories.projectId, projectId))
      .orderBy(budgetCategories.order);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}
