import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

describe("DialogContent cabe em telas baixas", () => {
  const dialog = source("components/ds/dialog.tsx");

  it("limita altura com dvh, header/footer fixos e só o corpo rola", () => {
    expect(dialog).toContain("max-h-[calc(100dvh-2rem)]");
    expect(dialog).toContain("env(safe-area-inset-top)");
    expect(dialog).toContain("env(safe-area-inset-bottom)");
    expect(dialog).toContain("flex-col overflow-hidden");
    expect(dialog).toContain("[&>form]:flex [&>form]:min-h-0 [&>form]:flex-1 [&>form]:flex-col");
    expect(dialog).toContain('export function DialogHeader');
    expect(dialog).toContain("shrink-0");
    expect(dialog).toContain('export function DialogFooter');
    expect(dialog).toContain('export function DialogBody');
    expect(dialog).toContain("overflow-y-auto");
    expect(dialog).toContain("bg-white");
    expect(dialog).toContain("rounded-lg");
  });
});

describe("modais de tarefa compactos", () => {
  it("agrupa datas, cor e status em duas colunas no desktop", () => {
    const kanban = source("components/task-dialog.tsx");
    const gantt = source("app/(app)/gantt/[id]/gantt-task-dialog.tsx");
    expect(kanban).toContain("DialogBody");
    expect(kanban).toContain("grid gap-3 sm:grid-cols-2");
    expect(kanban).toContain("grid grid-cols-2 gap-3");
    expect(kanban).not.toContain("max-h-[90vh]");
    expect(gantt).toContain("DialogBody");
    expect(gantt).toContain("grid gap-3 sm:grid-cols-2");
    expect(gantt).not.toContain("max-h-[90vh]");
    expect(gantt).not.toContain("overflow-y-auto\">");
  });
});

describe("demais dialogs usam o corpo rolável", () => {
  it("form dialogs e confirmações passam pelo DialogBody", () => {
    const files = [
      "app/(app)/obras/project-dialog.tsx",
      "app/(app)/fornecedores/supplier-dialog.tsx",
      "app/(app)/fornecedores/[id]/material-dialog.tsx",
      "app/(app)/obras/[id]/category-dialog.tsx",
      "app/(app)/kanban/[id]/column-dialog.tsx",
      "components/confirm-dialog.tsx",
    ];
    for (const file of files) {
      const text = source(file);
      expect(text, file).toContain("DialogBody");
      expect(text, file).not.toContain("max-h-[90vh]");
    }
  });

  it("overlays avulsos de exclusão passaram a ConfirmDialog", () => {
    const files = [
      "app/(app)/kanban/[id]/kanban-column.tsx",
      "app/(app)/obras/[id]/project-actions.tsx",
      "app/(app)/obras/archived-projects-section.tsx",
      "app/(app)/fornecedores/suppliers-list.tsx",
      "app/(app)/obras/[id]/budget-categories-list.tsx",
      "app/(app)/fornecedores/[id]/supplier-actions.tsx",
      "app/(app)/post-its/post-its-board.tsx",
    ];
    for (const file of files) {
      const text = source(file);
      expect(text, file).toContain("ConfirmDialog");
      expect(text, file).not.toContain("fixed inset-0 z-50 flex items-center justify-center");
    }
  });
});
