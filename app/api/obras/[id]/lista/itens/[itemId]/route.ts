import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projectSuggestedItems } from "@/lib/db/schema";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const patchSchema = z.object({
  quantity: z.number().positive().optional(),
  name: z.string().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id, itemId } = await params;
    const project = await getOwnedProject(id, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });

    const data = patchSchema.parse(await request.json());
    const [item] = await db
      .update(projectSuggestedItems)
      .set({
        ...(data.quantity != null ? { quantity: String(data.quantity) } : {}),
        ...(data.name ? { name: data.name } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(projectSuggestedItems.id, itemId), eq(projectSuggestedItems.projectId, id)))
      .returning();

    if (!item) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    revalidateDomainPages({ userId: user.id, projectId: id });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error updating suggested item:", error);
    return NextResponse.json({ error: "Erro ao atualizar item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id, itemId } = await params;
    const project = await getOwnedProject(id, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });

    const [item] = await db
      .delete(projectSuggestedItems)
      .where(and(eq(projectSuggestedItems.id, itemId), eq(projectSuggestedItems.projectId, id)))
      .returning();

    if (!item) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    revalidateDomainPages({ userId: user.id, projectId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting suggested item:", error);
    return NextResponse.json({ error: "Erro ao remover item" }, { status: 500 });
  }
}
