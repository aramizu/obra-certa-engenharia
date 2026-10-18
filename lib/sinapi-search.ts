import { DEFAULT_KNOWLEDGE_CATALOG, type CatalogMaterial } from "@/lib/kb-catalog";

export type SinapiSuggestion = {
  id: string;
  name: string;
  unit: string;
  sinapiCode: string | null;
  refUnit: string;
  refUnitPrice: number | null;
};

export function foldSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function kbMaterialCount() {
  return DEFAULT_KNOWLEDGE_CATALOG.materials.length;
}

export function toSinapiSuggestion(material: CatalogMaterial, refUnitPrice: number | null = null): SinapiSuggestion {
  return {
    id: material.id,
    name: material.name,
    unit: material.unit,
    sinapiCode: material.sinapiCode,
    refUnit: material.unit,
    refUnitPrice,
  };
}

export function searchSinapiMaterials(query: string, limit = 8): SinapiSuggestion[] {
  const needle = foldSearch(query);
  if (needle.length < 2) return [];

  const scored: Array<{ score: number; item: CatalogMaterial }> = [];
  const materialsById = new Map(DEFAULT_KNOWLEDGE_CATALOG.materials.map((row) => [row.id, row]));
  for (const material of DEFAULT_KNOWLEDGE_CATALOG.materials) {
    const name = foldSearch(material.name);
    const code = foldSearch(material.sinapiCode || "");
    const slug = foldSearch(material.slug);
    if (name.includes(needle)) scored.push({ score: name.startsWith(needle) ? 0 : 1, item: material });
    else if (code && code.includes(needle)) scored.push({ score: 2, item: material });
    else if (slug.includes(needle)) scored.push({ score: 3, item: material });
  }
  for (const composition of DEFAULT_KNOWLEDGE_CATALOG.compositions) {
    const code = foldSearch(composition.sinapiCode || "");
    if (!code || !code.includes(needle)) continue;
    const material = materialsById.get(composition.materialId);
    if (material) scored.push({ score: 2, item: material });
  }

  scored.sort((a, b) => a.score - b.score || a.item.name.localeCompare(b.item.name, "pt-BR"));
  const seen = new Set<string>();
  const out: SinapiSuggestion[] = [];
  for (const row of scored) {
    if (seen.has(row.item.id)) continue;
    seen.add(row.item.id);
    out.push(toSinapiSuggestion(row.item));
    if (out.length >= limit) break;
  }
  return out;
}
