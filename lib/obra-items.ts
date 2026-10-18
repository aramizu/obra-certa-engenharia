import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  budgetCategories,
  kbMaterials,
  materials,
  projects,
  suppliers,
  userTemplateItems,
  userTemplates,
  type Material,
} from "@/lib/db/schema";
import { formatISODate, today } from "@/lib/date";
import { computeItemTotal, emptyToNull, normalizeItemStatus, type ItemStatus } from "@/lib/item-status";
import { getOwnedSupplier } from "@/lib/owned-project";
import { InvalidRefError, requireBudgetCategoryOnProject, requireKbMaterial } from "@/lib/owned-refs";
import { getObraPreset, type TemplateItemDraft } from "@/lib/obra-templates";

export type ObraItemInput = {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  unitPrice?: string | null;
  supplierId?: string | null;
  budgetCategoryId?: string | null;
  groupName?: string | null;
  notes?: string | null;
  brand?: string | null;
  status?: string | null;
  kbRefId?: string | null;
  kbRefCode?: string | null;
  refUnit?: string | null;
  refUnitPrice?: string | null;
  newSupplierName?: string | null;
};

export async function getOwnedMaterial(materialId: string, userId: string) {
  const [row] = await db
    .select({ material: materials })
    .from(materials)
    .innerJoin(projects, eq(materials.projectId, projects.id))
    .where(and(eq(materials.id, materialId), eq(projects.userId, userId)))
    .limit(1);
  return row?.material ?? null;
}

export async function ensureGroup(projectId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const [existing] = await db
    .select()
    .from(budgetCategories)
    .where(and(eq(budgetCategories.projectId, projectId), eq(budgetCategories.name, trimmed)))
    .limit(1);
  if (existing) return existing;
  const [maxOrder] = await db
    .select({ max: sql<number>`COALESCE(MAX(${budgetCategories.order}), -1)` })
    .from(budgetCategories)
    .where(eq(budgetCategories.projectId, projectId));
  const [created] = await db
    .insert(budgetCategories)
    .values({
      projectId,
      name: trimmed,
      budgetedAmount: "0",
      order: Number(maxOrder?.max ?? -1) + 1,
    })
    .returning();
  return created;
}

export async function resolveSupplierId(
  userId: string,
  supplierId: string | null | undefined,
  newSupplierName: string | null | undefined
) {
  const createdName = emptyToNull(newSupplierName);
  if (createdName) {
    const [created] = await db
      .insert(suppliers)
      .values({ userId, name: createdName })
      .returning();
    return created.id;
  }
  const id = emptyToNull(supplierId);
  if (!id) return null;
  const owned = await getOwnedSupplier(id, userId);
  if (!owned) throw new InvalidRefError("Fornecedor inválido.");
  return owned.id;
}

export async function resolveGroupId(
  projectId: string,
  budgetCategoryId: string | null | undefined,
  groupName: string | null | undefined
) {
  const named = emptyToNull(groupName);
  if (named) {
    const group = await ensureGroup(projectId, named);
    return group?.id ?? null;
  }
  return requireBudgetCategoryOnProject(budgetCategoryId, projectId);
}

export function materialValuesFromInput(projectId: string, input: ObraItemInput, extras: {
  supplierId: string | null;
  budgetCategoryId: string | null;
  kbRefId: string | null;
}) {
  const quantity = emptyToNull(input.quantity);
  const unitPrice = emptyToNull(input.unitPrice);
  const status = normalizeItemStatus(input.status);
  return {
    projectId,
    name: input.name.trim(),
    brand: emptyToNull(input.brand),
    unit: emptyToNull(input.unit),
    quantity,
    unitPrice,
    totalPrice: computeItemTotal(quantity, unitPrice),
    supplierId: extras.supplierId,
    budgetCategoryId: extras.budgetCategoryId,
    notes: emptyToNull(input.notes),
    status,
    purchaseDate: status === "comprado" ? formatISODate(today()) : null,
    kbRefId: extras.kbRefId,
    kbRefCode: emptyToNull(input.kbRefCode),
    refUnit: emptyToNull(input.refUnit),
    refUnitPrice: emptyToNull(input.refUnitPrice),
    updatedAt: new Date(),
  };
}

export async function insertObraItem(projectId: string, userId: string, input: ObraItemInput) {
  const supplierId = await resolveSupplierId(userId, input.supplierId, input.newSupplierName);
  const budgetCategoryId = await resolveGroupId(projectId, input.budgetCategoryId, input.groupName);
  const kbRefId = await requireKbMaterial(input.kbRefId);
  const [item] = await db
    .insert(materials)
    .values(materialValuesFromInput(projectId, input, { supplierId, budgetCategoryId, kbRefId }))
    .returning();
  return item;
}

export async function applyTemplateItems(projectId: string, items: TemplateItemDraft[]) {
  const groups = new Map<string, string>();
  const kbRows = await db.select({ id: kbMaterials.id }).from(kbMaterials);
  const knownKb = new Set(kbRows.map((row) => row.id));
  for (const draft of items) {
    let budgetCategoryId: string | null = null;
    if (draft.groupName) {
      const cached = groups.get(draft.groupName);
      if (cached) budgetCategoryId = cached;
      else {
        const group = await ensureGroup(projectId, draft.groupName);
        if (group) {
          groups.set(draft.groupName, group.id);
          budgetCategoryId = group.id;
        }
      }
    }
    const kbRefId = draft.kbRefId && knownKb.has(draft.kbRefId) ? draft.kbRefId : null;
    await db.insert(materials).values({
      projectId,
      name: draft.name,
      quantity: draft.quantity,
      unit: draft.unit,
      unitPrice: draft.unitPrice,
      totalPrice: computeItemTotal(draft.quantity, draft.unitPrice),
      status: "a_definir" satisfies ItemStatus,
      budgetCategoryId,
      notes: draft.notes,
      kbRefId,
      kbRefCode: kbRefId ? draft.kbRefCode : null,
      refUnit: draft.refUnit,
      refUnitPrice: draft.refUnitPrice,
    });
  }
}

export async function applyObraTemplateKey(projectId: string, userId: string, templateKey: string | null | undefined) {
  const key = emptyToNull(templateKey);
  if (!key || key === "blank") return;
  if (key.startsWith("user:")) {
    const templateId = key.slice("user:".length);
    const [template] = await db
      .select()
      .from(userTemplates)
      .where(and(eq(userTemplates.id, templateId), eq(userTemplates.userId, userId)))
      .limit(1);
    if (!template) throw new InvalidRefError("Modelo inválido.");
    const rows = await db
      .select()
      .from(userTemplateItems)
      .where(eq(userTemplateItems.templateId, template.id))
      .orderBy(asc(userTemplateItems.sortOrder));
    await applyTemplateItems(
      projectId,
      rows.map((row) => ({
        name: row.name,
        quantity: row.quantity,
        unit: row.unit,
        unitPrice: row.unitPrice,
        groupName: row.groupName,
        notes: row.notes,
        kbRefId: row.kbRefId,
        kbRefCode: row.kbRefCode,
        refUnit: row.refUnit,
        refUnitPrice: row.refUnitPrice,
      }))
    );
    return;
  }
  const preset = getObraPreset(key);
  if (!preset || preset.items.length === 0) return;
  await applyTemplateItems(projectId, preset.items);
}

export async function saveProjectAsTemplate(projectId: string, userId: string, name: string) {
  const [template] = await db
    .insert(userTemplates)
    .values({ userId, name: name.trim() })
    .returning();
  const items = await db
    .select({
      item: materials,
      groupName: budgetCategories.name,
    })
    .from(materials)
    .leftJoin(
      budgetCategories,
      and(eq(budgetCategories.id, materials.budgetCategoryId), eq(budgetCategories.projectId, materials.projectId))
    )
    .where(eq(materials.projectId, projectId))
    .orderBy(asc(budgetCategories.order), asc(materials.createdAt));

  if (items.length) {
    await db.insert(userTemplateItems).values(
      items.map((row, index) => ({
        templateId: template.id,
        name: row.item.name,
        quantity: row.item.quantity,
        unit: row.item.unit,
        unitPrice: row.item.unitPrice,
        notes: row.item.notes,
        groupName: row.groupName,
        kbRefId: row.item.kbRefId,
        kbRefCode: row.item.kbRefCode,
        refUnit: row.item.refUnit,
        refUnitPrice: row.item.refUnitPrice,
        sortOrder: index,
      }))
    );
  }
  return template;
}

export function serializeMaterial(item: Material, extra?: { groupName?: string | null; supplierName?: string | null }) {
  return {
    ...item,
    status: normalizeItemStatus(item.status),
    groupName: extra?.groupName ?? null,
    supplierName: extra?.supplierName ?? null,
  };
}
