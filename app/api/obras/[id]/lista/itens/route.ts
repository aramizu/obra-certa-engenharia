import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { addCustomSuggestedItem } from "@/lib/project-lista";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  quantity: z.number().positive("Quantidade deve ser maior que zero"),
  categoryId: z.string().nullable().optional(),
  categoryName: z.string().min(1, "Categoria é obrigatória"),
  kbMaterialId: z.string().nullable().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const project = await getOwnedProject(id, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    if (isProjectArchived(project)) return archivedWriteResponse();

    const data = itemSchema.parse(await request.json());
    const item = await addCustomSuggestedItem(id, data);
    revalidateDomainPages({ userId: user.id, projectId: id });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error adding suggested item:", error);
    return NextResponse.json({ error: "Erro ao adicionar item" }, { status: 500 });
  }
}
