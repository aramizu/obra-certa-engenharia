import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  budgetCategories,
  materials,
  projectRoomModules,
  projectRooms,
  projectSuggestedItems,
  projects,
  suppliers,
} from "@/lib/db/schema";
import { getCachedKnowledgeCatalog } from "@/lib/cached-queries";
import {
  consolidateSuggestedList,
  type RoomSelection,
  type WorkType,
} from "@/lib/kb-engine";

export type RoomPayload = {
  name: string;
  areaM2: number;
  widthM?: number | null;
  lengthM?: number | null;
  perimeterM?: number | null;
  ceilingHeightM?: number | null;
  doors?: number | null;
  windows?: number | null;
  moduleIds: string[];
  packageIds: string[];
  extras?: Record<string, number>;
};

function n(value: string | number | null | undefined): number {
  return Number(value) || 0;
}

export async function loadProjectLista(projectId: string) {
  const catalog = await getCachedKnowledgeCatalog();
  const rooms = await db.select().from(projectRooms).where(eq(projectRooms.projectId, projectId));
  const roomIds = rooms.map((room) => room.id);
  const moduleRows =
    roomIds.length === 0
      ? []
      : await db.select().from(projectRoomModules).where(inArray(projectRoomModules.roomId, roomIds));
  const modulesByRoom = new Map<string, typeof moduleRows>();
  for (const row of moduleRows) {
    if (!roomIds.includes(row.roomId)) continue;
    const list = modulesByRoom.get(row.roomId) ?? [];
    list.push(row);
    modulesByRoom.set(row.roomId, list);
  }

  const roomSelections = rooms
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((room) => {
      const rows = modulesByRoom.get(room.id) ?? [];
      const extras: Record<string, number> = {};
      const moduleIds: string[] = [];
      const packageIds: string[] = [];
      for (const row of rows) {
        extras[row.moduleId] = n(row.extraQty);
        if (row.packageId) {
          if (!packageIds.includes(row.packageId)) packageIds.push(row.packageId);
        } else if (!moduleIds.includes(row.moduleId)) {
          moduleIds.push(row.moduleId);
        }
      }
      return {
        id: room.id,
        name: room.name,
        areaM2: n(room.areaM2),
        widthM: room.widthM ? n(room.widthM) : null,
        lengthM: room.lengthM ? n(room.lengthM) : null,
        perimeterM: room.perimeterM ? n(room.perimeterM) : null,
        ceilingHeightM: n(room.ceilingHeightM) || 2.7,
        doors: room.doors,
        windows: room.windows,
        moduleIds,
        packageIds,
        extras,
      };
    });

  const items = await db
    .select()
    .from(projectSuggestedItems)
    .where(eq(projectSuggestedItems.projectId, projectId));

  return { catalog, rooms: roomSelections, items: items.sort((a, b) => a.sortOrder - b.sortOrder) };
}

export async function saveProjectLista(projectId: string, workType: WorkType, rooms: RoomPayload[]) {
  const catalog = await getCachedKnowledgeCatalog();

  await db.update(projects).set({ workType, updatedAt: new Date() }).where(eq(projects.id, projectId));

  const existingRooms = await db.select({ id: projectRooms.id }).from(projectRooms).where(eq(projectRooms.projectId, projectId));
  for (const room of existingRooms) {
    await db.delete(projectRoomModules).where(eq(projectRoomModules.roomId, room.id));
  }
  await db.delete(projectRooms).where(eq(projectRooms.projectId, projectId));

  const selections: RoomSelection[] = [];
  for (const [index, room] of rooms.entries()) {
    const [created] = await db
      .insert(projectRooms)
      .values({
        projectId,
        name: room.name.trim(),
        areaM2: String(room.areaM2 || 0),
        widthM: room.widthM != null ? String(room.widthM) : null,
        lengthM: room.lengthM != null ? String(room.lengthM) : null,
        perimeterM: room.perimeterM != null ? String(room.perimeterM) : null,
        ceilingHeightM: String(room.ceilingHeightM || 2.7),
        doors: room.doors ?? 1,
        windows: room.windows ?? 0,
        sortOrder: index,
      })
      .returning();

    const extras = room.extras ?? {};
    const packageModuleIds = new Set<string>();
    for (const packageId of room.packageIds) {
      const pkg = catalog.packages.find((item) => item.id === packageId);
      if (!pkg) continue;
      for (const moduleId of pkg.moduleIds) {
        packageModuleIds.add(moduleId);
        await db.insert(projectRoomModules).values({
          roomId: created.id,
          moduleId,
          packageId,
          extraQty: String(extras[moduleId] || 0),
        });
      }
    }
    for (const moduleId of room.moduleIds) {
      if (packageModuleIds.has(moduleId)) continue;
      await db.insert(projectRoomModules).values({
        roomId: created.id,
        moduleId,
        packageId: null,
        extraQty: String(extras[moduleId] || 0),
      });
    }

    selections.push({
      room: {
        name: room.name,
        areaM2: room.areaM2,
        widthM: room.widthM,
        lengthM: room.lengthM,
        perimeterM: room.perimeterM,
        ceilingHeightM: room.ceilingHeightM,
        doors: room.doors,
        windows: room.windows,
      },
      moduleIds: room.moduleIds,
      packageIds: room.packageIds,
      extras,
    });
  }

  const lines = consolidateSuggestedList(catalog, workType, selections);
  const existing = await db.select().from(projectSuggestedItems).where(eq(projectSuggestedItems.projectId, projectId));
  const keptIds = new Set<string>();

  for (const [index, line] of lines.entries()) {
    const match = existing.find((item) => item.kbMaterialId === line.materialId && item.source === "suggested");
    if (match) {
      await db
        .update(projectSuggestedItems)
        .set({
          name: line.name,
          unit: line.unit,
          quantity: String(line.quantity),
          categoryId: line.categoryId,
          categoryName: line.categoryName,
          sinapiCode: line.sinapiCode,
          sortOrder: index,
          updatedAt: new Date(),
        })
        .where(eq(projectSuggestedItems.id, match.id));
      keptIds.add(match.id);
    } else {
      const [created] = await db
        .insert(projectSuggestedItems)
        .values({
          projectId,
          kbMaterialId: line.materialId,
          name: line.name,
          unit: line.unit,
          quantity: String(line.quantity),
          categoryId: line.categoryId,
          categoryName: line.categoryName,
          source: "suggested",
          sinapiCode: line.sinapiCode,
          sortOrder: index,
        })
        .returning();
      keptIds.add(created.id);
    }
  }

  for (const item of existing) {
    if (item.source === "custom") {
      keptIds.add(item.id);
      continue;
    }
    if (!keptIds.has(item.id) && !item.linkedMaterialId) {
      await db.delete(projectSuggestedItems).where(eq(projectSuggestedItems.id, item.id));
    }
  }

  return loadProjectLista(projectId);
}

export async function addCustomSuggestedItem(
  projectId: string,
  data: {
    name: string;
    unit: string;
    quantity: number;
    categoryId?: string | null;
    categoryName: string;
    kbMaterialId?: string | null;
  }
) {
  const existing = await db.select({ n: sql<number>`count(*)` }).from(projectSuggestedItems).where(eq(projectSuggestedItems.projectId, projectId));
  const [item] = await db
    .insert(projectSuggestedItems)
    .values({
      projectId,
      kbMaterialId: data.kbMaterialId || null,
      name: data.name.trim(),
      unit: data.unit,
      quantity: String(data.quantity),
      categoryId: data.categoryId || null,
      categoryName: data.categoryName,
      source: "custom",
      sortOrder: Number(existing[0]?.n ?? 0) + 1,
    })
    .returning();
  return item;
}

export async function ensureBudgetCategory(projectId: string, name: string, addAmount: number) {
  const [existing] = await db
    .select()
    .from(budgetCategories)
    .where(and(eq(budgetCategories.projectId, projectId), eq(budgetCategories.name, name)))
    .limit(1);

  if (existing) {
    const next = (n(existing.budgetedAmount) + addAmount).toFixed(2);
    const [updated] = await db
      .update(budgetCategories)
      .set({ budgetedAmount: next, updatedAt: new Date() })
      .where(eq(budgetCategories.id, existing.id))
      .returning();
    return updated;
  }

  const [maxOrder] = await db
    .select({ max: sql<number>`COALESCE(MAX(${budgetCategories.order}), -1)` })
    .from(budgetCategories)
    .where(eq(budgetCategories.projectId, projectId));

  const [created] = await db
    .insert(budgetCategories)
    .values({
      projectId,
      name,
      budgetedAmount: addAmount.toFixed(2),
      order: Number(maxOrder?.max ?? -1) + 1,
    })
    .returning();
  return created;
}

export async function linkSuggestedItem(opts: {
  projectId: string;
  itemId: string;
  supplierId: string;
  unitPrice: string;
  brand: string | null;
}) {
  const [item] = await db
    .select()
    .from(projectSuggestedItems)
    .where(and(eq(projectSuggestedItems.id, opts.itemId), eq(projectSuggestedItems.projectId, opts.projectId)))
    .limit(1);
  if (!item) return { error: "Item não encontrado." as const, status: 404 as const };

  if (item.linkedMaterialId) return { error: "Item já vinculado ao orçamento." as const, status: 409 as const };

  const quantity = n(item.quantity);
  const unitPrice = n(opts.unitPrice);
  const totalPrice = Number((quantity * unitPrice).toFixed(2));
  const category = await ensureBudgetCategory(opts.projectId, item.categoryName || "Materiais", totalPrice);

  const [material] = await db
    .insert(materials)
    .values({
      projectId: opts.projectId,
      budgetCategoryId: category.id,
      supplierId: opts.supplierId,
      name: item.name,
      brand: opts.brand,
      unit: item.unit,
      quantity: String(quantity),
      unitPrice: unitPrice.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      status: "quoted",
      notes: item.sinapiCode ? `SINAPI ${item.sinapiCode}` : null,
    })
    .returning();

  const [updated] = await db
    .update(projectSuggestedItems)
    .set({ linkedMaterialId: material.id, updatedAt: new Date() })
    .where(eq(projectSuggestedItems.id, item.id))
    .returning();

  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, opts.supplierId)).limit(1);

  return { item: updated, material, supplier };
}
