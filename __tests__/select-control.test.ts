import { readFileSync } from "node:fs";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { CONTROL_RADIUS_CLASS, selectTriggerClass } from "@/components/ds/cn";
import { optionsFromSelectChildren, SELECT_LAYER_Z } from "@/components/ds/select";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

describe("select / dropdown no design system", () => {
  it("usa o mesmo raio do botão Sair (rounded-md / 12px)", () => {
    expect(CONTROL_RADIUS_CLASS).toBe("rounded-md");
    expect(selectTriggerClass).toContain("rounded-md");
    expect(selectTriggerClass).not.toContain("rounded-full");
    expect(selectTriggerClass).not.toContain("rounded-xl");
    expect(selectTriggerClass).not.toContain("rounded-lg");
    const button = source("components/ds/button.tsx");
    expect(button).toContain("CONTROL_RADIUS_CLASS");
    const select = source("components/ds/select.tsx");
    expect(select).toContain("selectTriggerClass");
    expect(select).toContain("right-3");
    expect(select).not.toContain("rounded-full");
    expect(select).not.toContain("rounded-xl");
  });

  it("seta com inset igual ao padding do texto (px-3 / right-3, pr-9)", () => {
    expect(selectTriggerClass).toContain("appearance-none");
    expect(selectTriggerClass).toContain("px-3");
    expect(selectTriggerClass).toContain("pr-9");
    expect(selectTriggerClass).toContain("h-10");
    expect(selectTriggerClass).toContain("bg-white");
    const select = source("components/ds/select.tsx");
    expect(select).toContain("right-3");
    expect(select).toContain("ChevronDown");
    expect(select).not.toMatch(/mr-\d|ml-\d/);
  });

  it("é combobox custom com painel portaled acima do Dialog e sheet no mobile", () => {
    const select = source("components/ds/select.tsx");
    expect(select).toContain('role="combobox"');
    expect(select).toContain("createPortal");
    expect(select).toContain("max-width: 767px");
    expect(select).toContain('role="listbox"');
    expect(select).toContain("Check");
    expect(SELECT_LAYER_Z).toBeGreaterThan(50);
    expect(select).toContain(`z-[${SELECT_LAYER_Z}]`);
    expect(select).toContain("data-ds-native-select");
    expect(select).toContain("pointer-events-none");
  });

  it("lê as opções a partir dos <option> filhos", () => {
    expect(
      optionsFromSelectChildren([
        createElement("option", { value: "" }, "Todas"),
        createElement("option", { value: "none", disabled: true }, "Sem obra"),
        createElement("option", { value: "obra-1" }, "Casa"),
      ])
    ).toEqual([
      { value: "", label: "Todas", disabled: false },
      { value: "none", label: "Sem obra", disabled: true },
      { value: "obra-1", label: "Casa", disabled: false },
    ]);
  });

  it("nenhuma tela usa <select nativo; o DS centraliza o componente", () => {
    const files = [
      "app/(app)/dashboard-view.tsx",
      "app/(app)/estoque/estoque-view.tsx",
      "app/(app)/calendario/calendar-view.tsx",
      "app/(app)/post-its/post-its-board.tsx",
      "components/task-dialog.tsx",
      "app/(app)/gantt/[id]/gantt-task-dialog.tsx",
      "app/(app)/fornecedores/[id]/material-dialog.tsx",
      "app/(app)/fornecedores/supplier-dialog.tsx",
      "app/(app)/obras/[id]/lista/lista-view.tsx",
      "app/(app)/admin/base/admin-base-view.tsx",
      "app/(app)/design-system/catalog.tsx",
    ];
    for (const file of files) {
      const text = source(file);
      expect(text, file).not.toMatch(/<select[\s>]/);
      expect(text, file).toContain("<Select");
    }
  });
});
