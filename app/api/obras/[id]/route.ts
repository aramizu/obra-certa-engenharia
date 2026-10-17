import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  address: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  targetEndDate: z.string().nullable().optional(),
  totalBudget: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = projectSchema.parse(body);

    const [project] = await db
      .update(projects)
      .set({
        name: data.name,
        address: data.address || null,
        startDate: data.startDate || null,
        targetEndDate: data.targetEndDate || null,
        totalBudget: data.totalBudget || "0",
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .returning();

    if (!project) {
      return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar obra" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const [project] = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .returning();

    if (!project) {
      return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Erro ao excluir obra" },
      { status: 500 }
    );
  }
}
