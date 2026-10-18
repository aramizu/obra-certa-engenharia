import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CHIP_SURFACE_CLASS,
  DARK_CHIP_FILLS,
  PILL_CHIP_CLASS,
  TASK_CHIP_CLASS,
  chipContrastStyle,
  chipInkMix,
  contrastLuminance,
  isChipFillToken,
  pillChipProps,
  taskChipProps,
} from "@/components/ds/chip";

describe("contraste de chip", () => {
  it("fundo claro gera borda e texto mais escuros", () => {
    expect(contrastLuminance(0.82, "border")).toBeLessThan(0.82);
    expect(contrastLuminance(0.82, "text")).toBeLessThan(contrastLuminance(0.82, "border"));
    expect(chipInkMix("primary-wash")).toBe("#1c1612");
    expect(chipInkMix("hsl(48 92% 70%)")).toBe("#1c1612");
  });

  it("fundo escuro gera borda e texto mais claros", () => {
    expect(contrastLuminance(0.28, "border")).toBeGreaterThan(0.28);
    expect(contrastLuminance(0.28, "text")).toBeGreaterThan(contrastLuminance(0.28, "border"));
    for (const fill of DARK_CHIP_FILLS) {
      expect(chipInkMix(fill)).toBe("#fff");
    }
    expect(chipInkMix("hsl(210 58% 30%)")).toBe("#fff");
  });

  it("L 0.5 clareia (não fica igual ao fill)", () => {
    expect(contrastLuminance(0.5, "border")).toBeGreaterThan(0.5);
    expect(contrastLuminance(0.99, "border")).toBeLessThan(0.7);
    expect(contrastLuminance(0.01, "text")).toBeGreaterThan(0.6);
  });

  it("aceita token DS ou cor CSS arbitrária, com mix inline", () => {
    expect(isChipFillToken("signal-wash")).toBe(true);
    expect(isChipFillToken("hsl(48 92% 70%)")).toBe(false);
    expect(taskChipProps("primary-wash")["data-fill"]).toBe("primary-wash");
    const primaryStyle = taskChipProps("primary").style as Record<string, string>;
    expect(primaryStyle["--ds-chip-border"]).toContain("color-mix(in oklch");
    expect(primaryStyle["--ds-chip-border"]).toContain("#fff");
    expect(taskChipProps("hsl(48 92% 70%)").style).toMatchObject({
      "--ds-chip-fill": "hsl(48 92% 70%)",
      "--ds-chip-ink": "#1c1612",
    });
    const hslStyle = taskChipProps("hsl(48 92% 70%)").style as Record<string, string>;
    expect(hslStyle["--ds-chip-border"]).toContain("68%");
    expect(pillChipProps("delay").className).toBe(PILL_CHIP_CLASS);
    expect((chipContrastStyle("delay") as Record<string, string>)["--ds-chip-text"]).toContain("38%");
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

describe("CSS central do chip", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  it("não coloca color-mix em border-color (Tailwind v4 polyfill some com o contraste)", () => {
    expect(css).toContain(".ds-chip-surface");
    expect(css).toContain("border-color: var(--ds-chip-border, var(--ds-chip-ink))");
    expect(css).toContain("color: var(--ds-chip-text, var(--ds-chip-ink))");
    expect(css).not.toMatch(/\.ds-chip-surface[^{]*\{[^}]*border-color:\s*color-mix/);
    expect(css).toContain(".ds-sticky-tape");
    expect(css).toContain("top: -13px");
    expect(css).toContain("min-width: 96px");
  });
});
