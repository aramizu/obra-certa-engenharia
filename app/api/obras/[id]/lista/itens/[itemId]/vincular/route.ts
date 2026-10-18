import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { getOwnedProject, getOwnedSupplier } from "@/lib/owned-project";
import { linkSuggestedItem } from "@/lib/project-lista";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const schema = z.object({
  supplierId: z.string().uuid().optional(),
  newSupplier: z
    .object({
      name: z.string().min(1, "Nome do fornecedor é obrigatório"),
      category: z.string().nullable().optional(),
    })
    .optional(),
  unitPrice: z.string().min(1, "Preço é obrigatório"),
  brand: z.string().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id, itemId } = await params;
    const project = await getOwnedProject(id, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });

    const data = schema.parse(await request.json());
    if (Number(data.unitPrice) <= 0) {
      return NextResponse.json({ error: "Informe o preço em R$." }, { status: 400 });
    }

    let supplierId = data.supplierId;
    if (!supplierId && data.newSupplier) {
      const [created] = await db
        .insert(suppliers)
        .values({
          userId: user.id,
          name: data.newSupplier.name.trim(),
          category: data.newSupplier.category || null,
        })
        .returning();
      supplierId = created.id;
    }

    if (!supplierId) {
      return NextResponse.json({ error: "Selecione ou cadastre um fornecedor." }, { status: 400 });
    }

    const owned = await getOwnedSupplier(supplierId, user.id);
    if (!owned) return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });

    const result = await linkSuggestedItem({
      projectId: id,
      itemId,
      supplierId,
      unitPrice: data.unitPrice,
      brand: data.brand || null,
    });

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    revalidateDomainPages({ userId: user.id, projectId: id, supplierId });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error linking suggested item:", error);
    return NextResponse.json({ error: "Erro ao vincular fornecedor" }, { status: 500 });
  }
}
