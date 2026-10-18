import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SEM_OBRA_STOCK_KEY,
  formatQuantity,
  groupStockByProject,
  isStockMaterialStatus,
  stockItemHref,
  type StockItem,
} from "@/lib/stock";
import { SEM_OBRA_LABEL } from "@/lib/user-tasks";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

function item(partial: Partial<StockItem> & Pick<StockItem, "id" | "name">): StockItem {
  return {
    brand: null,
    quantity: "1",
    unit: "un",
    totalPrice: "0",
    purchaseDate: null,
    status: "purchased",
    projectId: "obra-1",
    projectName: "Casa",
    supplierId: null,
    supplierName: null,
    ...partial,
  };
}

describe("estoque — status comprado", () => {
  it("aceita os status existentes e equivalentes em português", () => {
    expect(isStockMaterialStatus("purchased")).toBe(true);
    expect(isStockMaterialStatus("delivered")).toBe(true);
    expect(isStockMaterialStatus("recebido")).toBe(true);
    expect(isStockMaterialStatus("comprado")).toBe(true);
    expect(isStockMaterialStatus("entregue")).toBe(true);
    expect(isStockMaterialStatus("quoted")).toBe(false);
    expect(isStockMaterialStatus("cotado")).toBe(false);
  });
});

describe("estoque — agrupamento e formatação", () => {
  it("agrupa por obra, soma totais e deixa Sem obra por último", () => {
    const groups = groupStockByProject([
      item({ id: "2", name: "Cimento", projectId: "b", projectName: "Anexo", totalPrice: "20" }),
      item({ id: "1", name: "Areia", projectId: "a", projectName: "Casa", totalPrice: "10.5" }),
      item({ id: "3", name: "Tinta", projectId: null, projectName: null, totalPrice: "5" }),
    ]);
    expect(groups.map((group) => group.name)).toEqual(["Anexo", "Casa", SEM_OBRA_LABEL]);
    expect(groups[0]?.total).toBe(20);
    expect(groups[1]?.total).toBe(10.5);
    expect(groups[2]?.key).toBe(SEM_OBRA_STOCK_KEY);
  });

  it("formata quantidade+unidade e aponta para a lista da obra", () => {
    expect(formatQuantity("12.5", "m²")).toBe("12,5 m²");
    expect(stockItemHref({ projectId: "obra-1", supplierId: "f1" })).toBe("/obras/obra-1/lista");
    expect(stockItemHref({ projectId: null, supplierId: "f1" })).toBe("/fornecedores/f1");
  });
});

describe("estoque — tela e cache do dono", () => {
  it("consulta só o usuário logado e revalida /estoque", () => {
    const page = source("app/(app)/estoque/page.tsx");
    const cache = source("lib/cached-queries.ts");
    const sidebar = source("components/app-sidebar.tsx");
    expect(page).toContain("validateSession");
    expect(page).toContain("getCachedUserStock(user.id)");
    expect(cache).toContain("activeProjectsOwnedBy(userId)");
    expect(cache).toContain("eq(suppliers.userId, userId)");
    expect(sidebar).toContain('name: "Estoque"');
    expect(sidebar).toContain('href: "/estoque"');
  });
});
