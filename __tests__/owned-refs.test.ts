import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { InvalidRefError, isInvalidRefError, normalizeOptionalId } from "@/lib/owned-refs";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

describe("normalizeOptionalId", () => {
  it("aceita string não vazia e descarta o resto", () => {
    expect(normalizeOptionalId("abc")).toBe("abc");
    expect(normalizeOptionalId("  abc  ")).toBe("abc");
    expect(normalizeOptionalId("")).toBeNull();
    expect(normalizeOptionalId("   ")).toBeNull();
    expect(normalizeOptionalId(null)).toBeNull();
    expect(normalizeOptionalId(undefined)).toBeNull();
    expect(normalizeOptionalId(1)).toBeNull();
  });
});

describe("InvalidRefError", () => {
  it("é 400 e reconhecido pelo type guard", () => {
    const error = new InvalidRefError("Categoria inválida para esta obra.");
    expect(error.status).toBe(400);
    expect(isInvalidRefError(error)).toBe(true);
    expect(isInvalidRefError(new Error("nope"))).toBe(false);
  });
});

describe("rotas recusam IDs de outra obra", () => {
  it("POST/PATCH de material exige budgetCategoryId da mesma obra", () => {
    const create = source("app/api/fornecedores/[id]/materiais/route.ts");
    const patch = source("app/api/fornecedores/[id]/materiais/[materialId]/route.ts");
    expect(create).toContain("requireBudgetCategoryOnProject");
    expect(create).toContain("isInvalidRefError");
    expect(patch).toContain("requireBudgetCategoryOnProject");
    expect(patch).toContain("isInvalidRefError");
  });

  it("lista/itens valida categoryId da KB e devolve 400", () => {
    const lista = source("lib/project-lista.ts");
    const route = source("app/api/obras/[id]/lista/itens/route.ts");
    expect(lista).toContain("requireKbCategory");
    expect(lista).toContain("requireKbMaterial");
    expect(route).toContain("isInvalidRefError");
  });

  it("kanban só aceita columnId do usuário; DELETE de tarefa inexistente é 404", () => {
    const create = source("app/api/kanban/tasks/route.ts");
    const move = source("app/api/kanban/tasks/[id]/move/route.ts");
    const task = source("app/api/kanban/tasks/[id]/route.ts");
    expect(create).toContain("getColumnOnUser");
    expect(move).toContain("getColumnOnUser");
    expect(task).toContain("getOwnedTask");
    expect(task).toContain(".returning()");
    expect(task).toContain("MISSING_TASK_ERROR");
    expect(task).toMatch(/if \(!deleted\) return NextResponse\.json\(\{ error: MISSING_TASK_ERROR \}, \{ status: 404 \}\)/);
  });

  it("gantt só liga dependência se as duas tarefas forem do mesmo usuário", () => {
    const deps = source("app/api/gantt/dependencies/route.ts");
    expect(deps).toContain("eq(tasks.userId, user.id)");
    expect(deps).toContain("inArray(tasks.id, [taskId, dependsOnTaskId])");
    expect(deps).toContain("related.length !== 2");
  });

  it("post-its só aceitam projectId do usuário", () => {
    const create = source("app/api/post-its/route.ts");
    const patch = source("app/api/post-its/[id]/route.ts");
    expect(create).toContain("getOwnedProject");
    expect(patch).toContain("getOwnedProject");
  });

  it("vincular só aceita supplierId do usuário", () => {
    const vincular = source("app/api/obras/[id]/lista/itens/[itemId]/vincular/route.ts");
    expect(vincular).toContain("getOwnedSupplier");
  });

  it("admin KB recusa categoryId inexistente com 400", () => {
    const store = source("lib/kb-store.ts");
    const route = source("app/api/admin/kb/route.ts");
    expect(store).toContain("requireKbCategory");
    expect(route).toContain("isInvalidRefError");
  });
});

describe("defesa em profundidade das somas e nomes", () => {
  it("gasto do painel só soma material da mesma projectId da categoria", () => {
    const home = source("app/(app)/page.tsx");
    expect(home).toContain("materialSpendOnCategoryProject");
    expect(home).toContain("sqlCompradoSpend");
    expect(home).not.toMatch(/leftJoin\(materials,\s*eq\(materials\.budgetCategoryId/);
  });

  it("itens da obra juntam grupo só da mesma obra", () => {
    const obra = source("app/(app)/obras/[id]/page.tsx");
    expect(obra).toContain("categoryNameOnMaterialProject");
    expect(obra).toContain("ObraItemsView");
    expect(obra).not.toMatch(/leftJoin\(budgetCategories,\s*eq\(budgetCategories\.id/);
  });

  it("rotas de itens/grupos/modelo checam dono da obra", () => {
    const create = source("app/api/obras/[id]/itens/route.ts");
    const patch = source("app/api/obras/[id]/itens/[itemId]/route.ts");
    const grupos = source("app/api/obras/[id]/grupos/route.ts");
    const modelo = source("app/api/obras/[id]/modelo/route.ts");
    expect(create).toContain("getOwnedProject");
    expect(patch).toContain("getOwnedProject");
    expect(patch).toContain("getOwnedMaterial");
    expect(grupos).toContain("getOwnedProject");
    expect(modelo).toContain("getOwnedProject");
  });

  it("nome da categoria no fornecedor só junta se for da mesma obra do material", () => {
    const page = source("app/(app)/fornecedores/[id]/page.tsx");
    expect(page).toContain("categoryNameOnMaterialProject");
    expect(page).not.toMatch(/leftJoin\(budgetCategories,\s*eq\(budgetCategories\.id/);
  });
});

describe("PATCH /api/materiais/[id]/status", () => {
  it("exporta PATCH e responde JSON em 400/404/405", () => {
    const route = source("app/api/materiais/[id]/status/route.ts");
    expect(route).toContain("export async function PATCH");
    expect(route).toContain('return NextResponse.json({ error: "Método não permitido" }, { status: 405 })');
    expect(route).toContain('return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 })');
    expect(route).toContain('return NextResponse.json({ error: "JSON inválido" }, { status: 400 })');
  });
});
