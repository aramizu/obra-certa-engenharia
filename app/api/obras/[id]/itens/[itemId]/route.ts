import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { materials } from "@/lib/db/schema";
import { MISSING_MATERIAL_ERROR, MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { formatISODate, today } from "@/lib/date";
import { ITEM_STATUSES, computeItemTotal, emptyToNull, normalizeItemStatus } from "@/lib/item-status";
import { getOwnedMaterial, resolveGroupId, resolveSupplierId } from "@/lib/obra-items";
import { getOwnedProject } from "@/lib/owned-project";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { isInvalidRefError, requireKbMaterial } from "@/lib/owned-refs";
import { revalidateDomainPages } from "@/lib/revalidate-app";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").optional(),
  quantity: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  unitPrice: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  budgetCategoryId: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  status: z.enum(ITEM_STATUSES).optional(),
  kbRefId: z.string().nullable().optional(),
  kbRefCode: z.string().nullable().optional(),
  refUnit: z.string().nullable().optional(),
  refUnitPrice: z.string().nullable().optional(),
  newSupplierName: z.string().nullable().optional(),
  clearGroup: z.boolean().optional(),
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
    if (isProjectArchived(project)) return archivedWriteResponse();

    const existing = await getOwnedMaterial(itemId, user.id);
    if (!existing || existing.projectId !== id) {
      return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 });
    }

    const data = schema.parse(await request.json());
    const supplierId =
      data.supplierId === undefined && !data.newSupplierName
        ? existing.supplierId
        : await resolveSupplierId(user.id, data.supplierId, data.newSupplierName);
    const budgetCategoryId = data.clearGroup
      ? null
      : await resolveGroupId(id, data.budgetCategoryId ?? existing.budgetCategoryId, data.groupName);
    const kbRefId = data.kbRefId === undefined ? existing.kbRefId : await requireKbMaterial(data.kbRefId);

    const quantity = data.quantity === undefined ? existing.quantity : emptyToNull(data.quantity);
    const unitPrice = data.unitPrice === undefined ? existing.unitPrice : emptyToNull(data.unitPrice);
    const status = data.status ? normalizeItemStatus(data.status) : normalizeItemStatus(existing.status);

    const [item] = await db
      .update(materials)
      .set({
        name: data.name?.trim() || existing.name,
        brand: data.brand === undefined ? existing.brand : emptyToNull(data.brand),
        unit: data.unit === undefined ? existing.unit : emptyToNull(data.unit),
        quantity,
        unitPrice,
        totalPrice: computeItemTotal(quantity, unitPrice),
        supplierId,
        budgetCategoryId,
        notes: data.notes === undefined ? existing.notes : emptyToNull(data.notes),
        status,
        purchaseDate:
          status === "comprado"
            ? existing.purchaseDate || formatISODate(today())
            : null,
        kbRefId,
        kbRefCode: data.kbRefCode === undefined ? existing.kbRefCode : emptyToNull(data.kbRefCode),
        refUnit: data.refUnit === undefined ? existing.refUnit : emptyToNull(data.refUnit),
        refUnitPrice: data.refUnitPrice === undefined ? existing.refUnitPrice : emptyToNull(data.refUnitPrice),
        updatedAt: new Date(),
      })
      .where(and(eq(materials.id, itemId), eq(materials.projectId, id)))
      .returning();

    if (!item) return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 });
    revalidateDomainPages({ userId: user.id, projectId: id, supplierId: item.supplierId });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (isInvalidRefError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error updating obra item:", error);
    return NextResponse.json({ error: "Erro ao salvar item" }, { status: 500 });
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
    if (isProjectArchived(project)) return archivedWriteResponse();

    const existing = await getOwnedMaterial(itemId, user.id);
    if (!existing || existing.projectId !== id) {
      return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 });
    }

    await db.delete(materials).where(and(eq(materials.id, itemId), eq(materials.projectId, id)));
    revalidateDomainPages({ userId: user.id, projectId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting obra item:", error);
    return NextResponse.json({ error: "Erro ao excluir item" }, { status: 500 });
  }
}
