import { describe, expect, it } from "vitest";
import { DEFAULT_KNOWLEDGE_CATALOG, KB_IDS } from "@/lib/kb-catalog";
import {
  applyWaste,
  consolidateSuggestedList,
  expandRoomModules,
  moduleQuantity,
  roomMetrics,
  roundQty,
} from "@/lib/kb-engine";

const catalog = DEFAULT_KNOWLEDGE_CATALOG;
const { U, P, M } = KB_IDS;

describe("métricas do cômodo", () => {
  it("usa perímetro informado e desconta vãos de porta e janela", () => {
    const metrics = roomMetrics({
      name: "Sala",
      areaM2: 16,
      perimeterM: 16,
      ceilingHeightM: 2.7,
      doors: 1,
      windows: 1,
    });
    expect(metrics.area).toBe(16);
    expect(metrics.perimeter).toBe(16);
    expect(metrics.ceilingArea).toBe(16);
    expect(metrics.wallArea).toBeCloseTo(16 * 2.7 - 0.8 * 2.1 - 1.2 * 1.2, 3);
  });

  it("estima perímetro quadrado a partir da área quando não há dimensões", () => {
    const metrics = roomMetrics({ name: "Quarto", areaM2: 25 });
    expect(metrics.perimeter).toBe(20);
    expect(metrics.height).toBe(2.7);
  });

  it("usa 2×(largura+comprimento) quando há dimensões", () => {
    const metrics = roomMetrics({ name: "Cozinha", areaM2: 8, widthM: 2, lengthM: 4 });
    expect(metrics.perimeter).toBe(12);
  });
});

describe("quantidade do módulo e perda", () => {
  it("piso usa a área do cômodo", () => {
    const piso = catalog.modules.find((item) => item.id === U.piso)!;
    const qty = moduleQuantity(piso, roomMetrics({ name: "Sala", areaM2: 20 }), 0);
    expect(qty).toBe(20);
  });

  it("drywall usa os metros extras de parede", () => {
    const drywall = catalog.modules.find((item) => item.id === U.drywall)!;
    const qty = moduleQuantity(drywall, roomMetrics({ name: "Sala", areaM2: 20 }), 3.5);
    expect(qty).toBe(3.5);
  });

  it("demolir parede converte metros lineares em m² com o pé-direito", () => {
    const demolir = catalog.modules.find((item) => item.id === U.demolirParede)!;
    const qty = moduleQuantity(demolir, roomMetrics({ name: "Sala", areaM2: 20, ceilingHeightM: 2.8 }), 3);
    expect(qty).toBeCloseTo(8.4, 3);
  });

  it("aplica percentual de perda sem duplicar o consumo", () => {
    expect(applyWaste(1, 10, 8)).toBe(10.8);
    expect(applyWaste(0.3, 20, 10)).toBe(6.6);
    expect(roundQty(0)).toBe(0);
  });

  it("pontos elétricos usam a quantidade extra", () => {
    const eletrico = catalog.modules.find((item) => item.id === U.eletrico)!;
    expect(moduleQuantity(eletrico, roomMetrics({ name: "Quarto", areaM2: 12 }), 6)).toBe(6);
    expect(moduleQuantity(eletrico, roomMetrics({ name: "Quarto", areaM2: 12 }), 0)).toBe(0);
  });
});

describe("pacotes, consolidação e tipo de obra", () => {
  it("expande o pacote de pintura e soma materiais de dois cômodos", () => {
    const lines = consolidateSuggestedList(catalog, "reforma", [
      {
        room: { name: "Sala", areaM2: 20, perimeterM: 18, ceilingHeightM: 2.7, doors: 1, windows: 2 },
        moduleIds: [],
        packageIds: [P.pintura],
        extras: {},
      },
      {
        room: { name: "Quarto", areaM2: 12, perimeterM: 14, ceilingHeightM: 2.7, doors: 1, windows: 1 },
        moduleIds: [],
        packageIds: [P.pintura],
        extras: {},
      },
    ]);

    const tinta = lines.find((line) => line.materialId === M.tinta);
    expect(tinta).toBeTruthy();
    expect(tinta!.unit).toBe("l");
    expect(tinta!.categoryName).toBe("Tintas");
    expect(tinta!.quantity).toBeGreaterThan(0);
  });

  it("obra na planta omite demolição mesmo dentro do pacote", () => {
    const reforma = expandRoomModules(catalog, "reforma", {
      room: { name: "Sala", areaM2: 20, ceilingHeightM: 2.7 },
      moduleIds: [],
      packageIds: [P.parede],
      extras: {},
    });
    const planta = expandRoomModules(catalog, "na_planta", {
      room: { name: "Sala", areaM2: 20, ceilingHeightM: 2.7 },
      moduleIds: [],
      packageIds: [P.parede],
      extras: {},
    });
    expect(reforma.some((item) => item.moduleId === U.demolirParede)).toBe(true);
    expect(planta).toHaveLength(0);
  });

  it("trocar piso consolida porcelanato com 8% de perda", () => {
    const lines = consolidateSuggestedList(catalog, "na_planta", [
      {
        room: { name: "Apto", areaM2: 20 },
        moduleIds: [],
        packageIds: [P.piso],
        extras: {},
      },
    ]);
    const porcelanato = lines.find((line) => line.materialId === M.porcelanato);
    expect(porcelanato?.quantity).toBe(21.6);
    expect(lines.find((line) => line.materialId === M.sacoEntulho)).toBeUndefined();
  });

  it("banheiro completo aplica pontos e conjunto padrão do pacote", () => {
    const expanded = expandRoomModules(catalog, "reforma", {
      room: { name: "Banheiro", areaM2: 5, perimeterM: 9, ceilingHeightM: 2.7, doors: 1, windows: 1 },
      moduleIds: [],
      packageIds: [P.banheiro],
      extras: {},
    });
    const eletrico = expanded.find((item) => item.moduleId === U.eletrico);
    const loucas = expanded.find((item) => item.moduleId === U.loucas);
    expect(eletrico?.extra).toBe(8);
    expect(loucas?.quantity).toBe(1);
  });
});
