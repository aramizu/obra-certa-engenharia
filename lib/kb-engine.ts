import type { CatalogModule, KnowledgeCatalog } from "@/lib/kb-catalog";

export type WorkType = "reforma" | "na_planta";

export type RoomInput = {
  name: string;
  areaM2: number;
  widthM?: number | null;
  lengthM?: number | null;
  perimeterM?: number | null;
  ceilingHeightM?: number | null;
  doors?: number | null;
  windows?: number | null;
};

export type RoomMetrics = {
  area: number;
  perimeter: number;
  height: number;
  wallArea: number;
  ceilingArea: number;
};

export const DEFAULT_CEILING_M = 2.7;
export const DOOR_AREA_M2 = 0.8 * 2.1;
export const WINDOW_AREA_M2 = 1.2 * 1.2;

export function roomMetrics(room: RoomInput): RoomMetrics {
  const area = Math.max(0, Number(room.areaM2) || 0);
  const height = Number(room.ceilingHeightM) > 0 ? Number(room.ceilingHeightM) : DEFAULT_CEILING_M;
  const peri = Number(room.perimeterM);
  const width = Number(room.widthM);
  const length = Number(room.lengthM);
  let perimeter = 0;
  if (peri > 0) perimeter = peri;
  else if (width > 0 && length > 0) perimeter = 2 * (width + length);
  else if (area > 0) perimeter = 4 * Math.sqrt(area);

  const doors = Math.max(0, Number(room.doors) || 0);
  const windows = Math.max(0, Number(room.windows) || 0);
  const openings = doors * DOOR_AREA_M2 + windows * WINDOW_AREA_M2;
  const wallArea = Math.max(0, perimeter * height - openings);

  return { area, perimeter, height, wallArea, ceilingArea: area };
}

export function roundQty(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 1000) / 1000;
}

export function applyWaste(consumption: number, quantity: number, wastePct: number): number {
  const waste = Number.isFinite(wastePct) ? Math.max(0, wastePct) : 0;
  return roundQty(consumption * quantity * (1 + waste / 100));
}

export function extraIsLinearMeters(mod: CatalogModule): boolean {
  const label = (mod.extraLabel || "").toLowerCase();
  return mod.extraKind === "wall_m" && (mod.qtyFrom === "length_m" || label.startsWith("metros"));
}

export function moduleQuantity(mod: CatalogModule, metrics: RoomMetrics, extra = 0): number {
  const extraN = Math.max(0, Number(extra) || 0);
  switch (mod.qtyFrom) {
    case "area":
      return metrics.area;
    case "ceiling_area":
      return metrics.ceilingArea;
    case "length_m":
      return extraN;
    case "points":
      return extraN;
    case "units":
      return extraN > 0 ? extraN : 1;
    case "wall_area":
      if (extraN > 0) {
        return extraIsLinearMeters(mod) ? extraN * metrics.height : extraN;
      }
      return metrics.wallArea;
    default:
      return 0;
  }
}

export function modulesForWorkType(catalog: KnowledgeCatalog, workType: WorkType) {
  if (workType === "na_planta") return catalog.modules.filter((module) => !module.isDemolition);
  return catalog.modules;
}

export type RoomSelection = {
  room: RoomInput;
  moduleIds: string[];
  packageIds: string[];
  extras: Record<string, number>;
};

export type ExpandedModule = {
  moduleId: string;
  extra: number;
  quantity: number;
};

export function expandRoomModules(
  catalog: KnowledgeCatalog,
  workType: WorkType,
  selection: RoomSelection
): ExpandedModule[] {
  const allowed = new Set(modulesForWorkType(catalog, workType).map((module) => module.id));
  const extras = { ...selection.extras };
  const ids = new Set(selection.moduleIds.filter((id) => allowed.has(id)));

  for (const packageId of selection.packageIds) {
    const pkg = catalog.packages.find((item) => item.id === packageId);
    if (!pkg) continue;
    for (const moduleId of pkg.moduleIds) {
      if (!allowed.has(moduleId)) continue;
      ids.add(moduleId);
      const mod = catalog.modules.find((item) => item.id === moduleId);
      if (!mod) continue;
      const current = Number(extras[moduleId]) || 0;
      if (current > 0) continue;
      if (mod.extraKind === "points" && pkg.defaultPoints) extras[moduleId] = pkg.defaultPoints;
      if (mod.extraKind === "count" && pkg.defaultCount) extras[moduleId] = pkg.defaultCount;
      if (mod.extraKind === "wall_m" && pkg.defaultWallM) extras[moduleId] = pkg.defaultWallM;
    }
  }

  const metrics = roomMetrics(selection.room);
  const expanded: ExpandedModule[] = [];
  for (const moduleId of ids) {
    const mod = catalog.modules.find((item) => item.id === moduleId);
    if (!mod) continue;
    const extra = Number(extras[moduleId]) || 0;
    const quantity = moduleQuantity(mod, metrics, extra);
    if (quantity <= 0) continue;
    expanded.push({ moduleId, extra, quantity });
  }
  return expanded;
}

export type SuggestedLine = {
  materialId: string;
  name: string;
  unit: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  sinapiCode: string | null;
};

export function consolidateSuggestedList(
  catalog: KnowledgeCatalog,
  workType: WorkType,
  rooms: RoomSelection[]
): SuggestedLine[] {
  const byMaterial = new Map<string, SuggestedLine>();
  const categoryName = (id: string) => catalog.categories.find((item) => item.id === id)?.name ?? "";

  for (const selection of rooms) {
    for (const expanded of expandRoomModules(catalog, workType, selection)) {
      const compositions = catalog.compositions.filter((item) => item.moduleId === expanded.moduleId);
      for (const composition of compositions) {
        const material = catalog.materials.find((item) => item.id === composition.materialId);
        if (!material) continue;
        const quantity = applyWaste(composition.consumption, expanded.quantity, composition.wastePct);
        if (quantity <= 0) continue;
        const current = byMaterial.get(material.id);
        if (current) {
          current.quantity = roundQty(current.quantity + quantity);
        } else {
          byMaterial.set(material.id, {
            materialId: material.id,
            name: material.name,
            unit: material.unit,
            categoryId: material.categoryId,
            categoryName: categoryName(material.categoryId),
            quantity,
            sinapiCode: material.sinapiCode,
          });
        }
      }
    }
  }

  const order = new Map(catalog.categories.map((item, index) => [item.id, index]));
  return [...byMaterial.values()].sort((a, b) => {
    const byCategory = (order.get(a.categoryId) ?? 99) - (order.get(b.categoryId) ?? 99);
    if (byCategory !== 0) return byCategory;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function formatQty(n: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(n);
}
