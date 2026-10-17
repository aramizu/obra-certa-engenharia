import { describe, expect, it } from "vitest";
import {
  DOMAIN_KEEP_TABLES,
  DOMAIN_RESET_TABLES,
  OBRA_CASCADE_TABLES,
  OBRA_PRESERVE_ON_DELETE,
  SUPPLIER_FK_ON_OBRA_DELETE,
  formatProjectDeleteWarning,
} from "@/lib/domain-data";

describe("exclusão de obra (cascade)", () => {
  it("apaga tudo vinculado à obra e não apaga o cadastro de fornecedores", () => {
    expect(OBRA_CASCADE_TABLES).toEqual([
      "budget_categories",
      "materials",
      "task_columns",
      "tasks",
      "task_dependencies",
    ]);
    expect(OBRA_PRESERVE_ON_DELETE).toEqual(["suppliers"]);
    expect(SUPPLIER_FK_ON_OBRA_DELETE).toBe("set null");
    expect(OBRA_CASCADE_TABLES).not.toContain("suppliers");
    expect(OBRA_CASCADE_TABLES).not.toContain("users");
    expect(OBRA_CASCADE_TABLES).not.toContain("sessions");
  });

  it("formata o aviso do diálogo com as quantidades da obra", () => {
    expect(formatProjectDeleteWarning({ tasks: 12, materials: 30 })).toBe(
      "Isso apaga 12 tarefas e 30 materiais desta obra."
    );
    expect(formatProjectDeleteWarning({ tasks: 1, materials: 1 })).toBe(
      "Isso apaga 1 tarefa e 1 material desta obra."
    );
  });
});

describe("reset one-off de domínio", () => {
  it("apaga tabelas de obra/fornecedor e preserva contas", () => {
    expect([...DOMAIN_RESET_TABLES]).toEqual([
      "task_dependencies",
      "tasks",
      "task_columns",
      "materials",
      "budget_categories",
      "projects",
      "suppliers",
    ]);
    expect([...DOMAIN_KEEP_TABLES]).toEqual(["users", "sessions", "rate_limits"]);
    for (const table of DOMAIN_KEEP_TABLES) {
      expect(DOMAIN_RESET_TABLES).not.toContain(table);
    }
  });
});
