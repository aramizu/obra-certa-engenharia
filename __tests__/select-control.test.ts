import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONTROL_RADIUS_CLASS, selectTriggerClass } from "@/components/ds/cn";

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
});
