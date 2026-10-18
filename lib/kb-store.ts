import { eq } from "drizzle-orm";
import {
  DEFAULT_KNOWLEDGE_CATALOG,
  type CatalogComposition,
  type CatalogMaterial,
  type CatalogModule,
  type CatalogPackage,
  type KnowledgeCatalog,
  type QtyFrom,
} from "@/lib/kb-catalog";
import { db } from "@/lib/db";
import {
  kbCompositions,
  kbMaterials,
  kbModules,
  kbPackageModules,
  kbPackages,
  kbSupplierCategories,
} from "@/lib/db/schema";

function num(value: string | number | null | undefined): number {
  return Number(value) || 0;
}

export async function ensureKnowledgeBase(): Promise<void> {
  const existing = await db.select({ id: kbSupplierCategories.id }).from(kbSupplierCategories).limit(1);
  if (existing.length > 0) return;

  const catalog = DEFAULT_KNOWLEDGE_CATALOG;
  try {
    if (catalog.categories.length) {
      await db.insert(kbSupplierCategories).values(
        catalog.categories.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          sortOrder: item.sortOrder,
        }))
      );
    }
    if (catalog.materials.length) {
      await db.insert(kbMaterials).values(
        catalog.materials.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          unit: item.unit,
          categoryId: item.categoryId,
          sinapiCode: item.sinapiCode,
          notes: item.notes,
        }))
      );
    }
    if (catalog.modules.length) {
      await db.insert(kbModules).values(
        catalog.modules.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          description: item.description,
          quantityUnit: item.quantityUnit,
          qtyFrom: item.qtyFrom,
          isDemolition: item.isDemolition,
          extraLabel: item.extraLabel,
          extraKind: item.extraKind,
          sortOrder: item.sortOrder,
        }))
      );
    }
    if (catalog.compositions.length) {
      await db.insert(kbCompositions).values(
        catalog.compositions.map((item) => ({
          id: item.id,
          moduleId: item.moduleId,
          materialId: item.materialId,
          consumption: String(item.consumption),
          wastePct: String(item.wastePct),
          sinapiCode: item.sinapiCode,
        }))
      );
    }
    if (catalog.packages.length) {
      await db.insert(kbPackages).values(
        catalog.packages.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          description: item.description,
          defaultPoints: item.defaultPoints ?? null,
          defaultWallM: item.defaultWallM != null ? String(item.defaultWallM) : null,
          defaultCount: item.defaultCount ?? null,
        }))
      );
      const links = catalog.packages.flatMap((pkg, pkgIndex) =>
        pkg.moduleIds.map((moduleId, index) => ({
          packageId: pkg.id,
          moduleId,
          sortOrder: pkgIndex * 100 + index,
        }))
      );
      if (links.length) await db.insert(kbPackageModules).values(links);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/duplicate|unique/i.test(message)) throw error;
  }
}

export async function loadKnowledgeCatalog(): Promise<KnowledgeCatalog> {
  await ensureKnowledgeBase();

  const [categories, materials, modules, compositions, packages, packageModules] = await Promise.all([
    db.select().from(kbSupplierCategories),
    db.select().from(kbMaterials),
    db.select().from(kbModules),
    db.select().from(kbCompositions),
    db.select().from(kbPackages),
    db.select().from(kbPackageModules),
  ]);

  const modulesByPackage = new Map<string, string[]>();
  for (const link of packageModules.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const list = modulesByPackage.get(link.packageId) ?? [];
    list.push(link.moduleId);
    modulesByPackage.set(link.packageId, list);
  }

  const catalog: KnowledgeCatalog = {
    categories: categories
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ id: item.id, slug: item.slug, name: item.name, sortOrder: item.sortOrder })),
    materials: materials.map(
      (item): CatalogMaterial => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        unit: item.unit,
        categoryId: item.categoryId,
        sinapiCode: item.sinapiCode,
        notes: item.notes,
      })
    ),
    modules: modules
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (item): CatalogModule => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          description: item.description,
          quantityUnit: item.quantityUnit,
          qtyFrom: item.qtyFrom as QtyFrom,
          isDemolition: item.isDemolition,
          extraLabel: item.extraLabel,
          extraKind: (item.extraKind as CatalogModule["extraKind"]) ?? null,
          sortOrder: item.sortOrder,
        })
      ),
    compositions: compositions.map(
      (item): CatalogComposition => ({
        id: item.id,
        moduleId: item.moduleId,
        materialId: item.materialId,
        consumption: num(item.consumption),
        wastePct: num(item.wastePct),
        sinapiCode: item.sinapiCode,
      })
    ),
    packages: packages.map(
      (item): CatalogPackage => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        moduleIds: modulesByPackage.get(item.id) ?? [],
        defaultPoints: item.defaultPoints ?? undefined,
        defaultWallM: item.defaultWallM != null ? num(item.defaultWallM) : undefined,
        defaultCount: item.defaultCount ?? undefined,
      })
    ),
  };

  if (catalog.categories.length === 0) return DEFAULT_KNOWLEDGE_CATALOG;
  return catalog;
}

export async function patchKbMaterial(
  id: string,
  data: Partial<{ name: string; unit: string; categoryId: string; sinapiCode: string | null; notes: string | null }>
) {
  const [row] = await db
    .update(kbMaterials)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(kbMaterials.id, id))
    .returning();
  return row ?? null;
}

export async function patchKbComposition(id: string, data: Partial<{ consumption: string; wastePct: string; sinapiCode: string | null }>) {
  const [row] = await db
    .update(kbCompositions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(kbCompositions.id, id))
    .returning();
  return row ?? null;
}

export async function patchKbCategory(id: string, data: Partial<{ name: string; sortOrder: number }>) {
  const [row] = await db
    .update(kbSupplierCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(kbSupplierCategories.id, id))
    .returning();
  return row ?? null;
}

export async function patchKbModule(
  id: string,
  data: Partial<{ name: string; description: string; extraLabel: string | null }>
) {
  const [row] = await db
    .update(kbModules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(kbModules.id, id))
    .returning();
  return row ?? null;
}
