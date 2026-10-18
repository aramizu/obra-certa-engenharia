import { describe, expect, it } from "vitest";
import {
  CHIP_SURFACE_CLASS,
  PILL_CHIP_CLASS,
  TASK_CHIP_CLASS,
  contrastLuminance,
  isChipFillToken,
  pillChipProps,
  taskChipProps,
} from "@/components/ds/chip";

describe("contraste de chip", () => {
  it("fundo claro gera borda e texto mais escuros", () => {
    expect(contrastLuminance(0.82, "border")).toBeLessThan(0.5);
    expect(contrastLuminance(0.82, "text")).toBeLessThan(contrastLuminance(0.82, "border"));
  });

  it("fundo escuro gera borda e texto mais claros", () => {
    expect(contrastLuminance(0.28, "border")).toBeGreaterThan(0.5);
    expect(contrastLuminance(0.28, "text")).toBeGreaterThan(contrastLuminance(0.28, "border"));
  });

  it("L 0.5 fica no meio e é limitado aos tetos", () => {
    expect(contrastLuminance(0.5, "border")).toBe(0.5);
    expect(contrastLuminance(0.99, "border")).toBe(0.18);
    expect(contrastLuminance(0.01, "text")).toBe(0.98);
  });

  it("aceita token DS ou cor CSS arbitrária", () => {
    expect(isChipFillToken("signal-wash")).toBe(true);
    expect(isChipFillToken("hsl(48 92% 70%)")).toBe(false);
    expect(taskChipProps("primary-wash")["data-fill"]).toBe("primary-wash");
    expect(taskChipProps("hsl(48 92% 70%)").style).toEqual({ "--ds-chip-fill": "hsl(48 92% 70%)" });
    expect(pillChipProps("delay").className).toBe(PILL_CHIP_CLASS);
  });
});

describe("raio de tarefa vs pílula", () => {
  it("balão de tarefa usa o raio de card, não pílula", () => {
    expect(TASK_CHIP_CLASS).toContain(CHIP_SURFACE_CLASS);
    expect(TASK_CHIP_CLASS).toContain("ds-chip");
    expect(TASK_CHIP_CLASS).not.toContain("ds-chip-pill");
    expect(PILL_CHIP_CLASS).toContain("ds-chip-pill");
  });
});
