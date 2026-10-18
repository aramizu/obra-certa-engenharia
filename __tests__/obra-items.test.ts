import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeItemTotal,
  isCompradoStatus,
  isToBuyStatus,
  normalizeItemStatus,
} from "@/lib/item-status";
import { parseItemLine } from "@/lib/parse-item-line";
import { foldSearch, kbMaterialCount, searchSinapiMaterials } from "@/lib/sinapi-search";
import { OBRA_PRESETS } from "@/lib/obra-templates";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

describe("parse de linha rápida", () => {
  it("lê nome, quantidade, unidade e preço em máscara BR", () => {
    expect(parseItemLine("piso vinílico 35 m2 R$ 89")).toEqual({
      name: "piso vinílico",
      quantity: 35,
      unit: "m2",
      unitPrice: 89,
    });
    expect(parseItemLine("20 sacos cimento 32,90")).toEqual({
      name: "cimento",
      quantity: 20,
      unit: "saco",
      unitPrice: 32.9,
    });
  });

  it("mantém só o nome quando não há qtd/preço", () => {
    expect(parseItemLine("fita isolante")).toEqual({
      name: "fita isolante",
      quantity: null,
      unit: null,
      unitPrice: null,
    });
  });
});

describe("status de item", () => {
  it("mapeia equivalentes antigos e calcula total", () => {
    expect(normalizeItemStatus("quoted")).toBe("cotando");
    expect(normalizeItemStatus("purchased")).toBe("comprado");
    expect(normalizeItemStatus("delivered")).toBe("comprado");
    expect(normalizeItemStatus(undefined)).toBe("a_definir");
    expect(isCompradoStatus("comprado")).toBe(true);
    expect(isToBuyStatus("a_definir")).toBe(true);
    expect(isToBuyStatus("cotando")).toBe(true);
    expect(isToBuyStatus("comprado")).toBe(false);
    expect(computeItemTotal("10", "2.5")).toBe("25.00");
    expect(computeItemTotal(null, "10")).toBeNull();
  });
});

describe("busca SINAPI", () => {
  it("é acento-insensitive e não exige preço de referência", () => {
    expect(kbMaterialCount()).toBeGreaterThan(0);
    const cimento = searchSinapiMaterials("cimento");
    expect(cimento.length).toBeGreaterThan(0);
    expect(cimento[0]?.name.toLowerCase()).toContain("cimento");
    const accent = searchSinapiMaterials("areia");
    expect(accent.some((row) => foldSearch(row.name).includes("areia"))).toBe(true);
    expect(searchSinapiMaterials("cimént").length).toBeGreaterThan(0);
  });
});

describe("modelos de obra", () => {
  it("tem em branco e os três presets com 5–8 itens", () => {
    expect(OBRA_PRESETS.map((preset) => preset.key)).toEqual(["blank", "piso", "drywall", "sacada"]);
    expect(OBRA_PRESETS[0]?.items).toEqual([]);
    for (const preset of OBRA_PRESETS.filter((row) => row.key !== "blank")) {
      expect(preset.items.length).toBeGreaterThanOrEqual(5);
      expect(preset.items.length).toBeLessThanOrEqual(8);
      expect(preset.items.every((item) => item.name)).toBe(true);
    }
  });
});

describe("ficha da obra e redirect da lista", () => {
  it("lista redireciona para a ficha e a ficha usa a view de itens", () => {
    const lista = source("app/(app)/obras/[id]/lista/page.tsx");
    const obra = source("app/(app)/obras/[id]/page.tsx");
    const nova = source("app/(app)/obras/nova/create-obra-form.tsx");
    expect(lista).toContain('redirect(`/obras/${id}`)');
    expect(obra).toContain("ObraItemsView");
    expect(obra).not.toContain("Gerar lista de materiais");
    expect(nova).toContain("templateKey");
    expect(nova).not.toContain("Continuar para a lista");
  });
});
