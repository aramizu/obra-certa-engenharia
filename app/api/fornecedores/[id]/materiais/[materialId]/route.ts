import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { materials, suppliers, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { MISSING_MATERIAL_ERROR, MISSING_SUPPLIER_ERROR } from "@/lib/domain-data";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const materialSchema = z.object({
  projectId: z.string().min(1, "Obra é obrigatória"),
  budgetCategoryId: z.string().nullable().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  brand: z.string().nullable().optional(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  quantityPerUnit: z.string().nullable().optional(),
  quantity: z.string().min(1, "Quantidade é obrigatória"),
  unitPrice: z.string().min(1, "Preço unitário é obrigatório"),
  totalPrice: z.string().min(1, "Preço total é obrigatório"),
  status: z.enum(["quoted", "purchased"]),
  purchaseDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

async function verifySupplierOwnership(supplierId: string, userId: string) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.userId, userId)))
    .limit(1);

  return !!supplier;
}

async function verifyMaterialAccess(materialId: string, supplierId: string, userId: string) {
  const [material] = await db
    .select({ projectUserId: projects.userId })
    .from(materials)
    .innerJoin(projects, eq(materials.projectId, projects.id))
    .where(and(eq(materials.id, materialId), eq(materials.supplierId, supplierId)))
    .limit(1);

  return material && material.projectUserId === userId;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: supplierId, materialId } = await params;

    const isOwner = await verifySupplierOwnership(supplierId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: MISSING_SUPPLIER_ERROR }, { status: 404 });
    }

    const hasAccess = await verifyMaterialAccess(materialId, supplierId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 });
    }

    const body = await request.json();
    const data = materialSchema.parse(body);

    const [material] = await db
      .update(materials)
      .set({
        projectId: data.projectId,
        budgetCategoryId: data.budgetCategoryId || null,
        name: data.name,
        brand: data.brand || null,
        unit: data.unit,
        quantityPerUnit: data.quantityPerUnit || null,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
        status: data.status,
        purchaseDate: data.purchaseDate || null,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(and(eq(materials.id, materialId), eq(materials.supplierId, supplierId)))
      .returning();

    if (!material) {
      return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 });
    }

    revalidateDomainPages(data.projectId, supplierId);
    return NextResponse.json({ success: true, material });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar material" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: supplierId, materialId } = await params;

    const isOwner = await verifySupplierOwnership(supplierId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: MISSING_SUPPLIER_ERROR }, { status: 404 });
    }

    const hasAccess = await verifyMaterialAccess(materialId, supplierId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 });
    }

    const [material] = await db
      .delete(materials)
      .where(and(eq(materials.id, materialId), eq(materials.supplierId, supplierId)))
      .returning();

    if (!material) {
      return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 });
    }

    revalidateDomainPages(material.projectId, supplierId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Erro ao excluir material" },
      { status: 500 }
    );
  }
}
