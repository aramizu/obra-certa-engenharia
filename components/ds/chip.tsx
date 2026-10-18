import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from "react";
import { cn } from "./cn";

/** Raio do item "Minhas tarefas" no painel — não é pílula. */
export const TASK_CHIP_RADIUS_CLASS = "ds-chip";
export const PILL_CHIP_RADIUS_CLASS = "ds-chip-pill";
export const CHIP_SURFACE_CLASS = "ds-chip-surface";

/** Balão de tarefa (Gantt, calendário, listas): mesmo raio do dashboard. */
export const TASK_CHIP_CLASS = `${CHIP_SURFACE_CLASS} ${TASK_CHIP_RADIUS_CLASS}`;
/** Selo compacto (status, prioridade, categoria). */
export const PILL_CHIP_CLASS = `${CHIP_SURFACE_CLASS} ${PILL_CHIP_RADIUS_CLASS}`;

export const CHIP_FILL_TOKENS = [
  "white",
  "paper",
  "concrete",
  "background",
  "graphite",
  "graphite-2",
  "primary",
  "primary-wash",
  "signal",
  "signal-wash",
  "blueprint",
  "blueprint-wash",
  "done",
  "done-wash",
  "delay",
  "delay-wash",
] as const;

export type ChipFillToken = (typeof CHIP_FILL_TOKENS)[number];

/** Tokens escuros: borda/texto misturam com branco (~30% mais claros). */
export const DARK_CHIP_FILLS = ["graphite", "graphite-2", "primary", "blueprint", "done", "delay"] as const;

export function isChipFillToken(value: unknown): value is ChipFillToken {
  return typeof value === "string" && (CHIP_FILL_TOKENS as readonly string[]).includes(value);
}

export function chipInkMix(fill: ChipFillToken | string | null | undefined): "#fff" | "#1c1612" {
  if (!fill) return "#1c1612";
  if (isChipFillToken(fill)) {
    return (DARK_CHIP_FILLS as readonly string[]).includes(fill) ? "#fff" : "#1c1612";
  }
  const hsl = fill.match(/hsla?\(\s*[\d.]+[\s,]+[\d.]+%?[\s,]+([\d.]+)%/i);
  if (hsl) return Number(hsl[1]) > 50 ? "#1c1612" : "#fff";
  const oklch = fill.match(/oklch\(\s*([\d.]+)/i);
  if (oklch) return Number(oklch[1]) > 0.5 ? "#1c1612" : "#fff";
  return "#1c1612";
}

/** color-mix no inline style — o PostCSS do Tailwind v4 não reescreve. */
export function chipContrastStyle(fill?: ChipFillToken | string | null): CSSProperties {
  const ink = chipInkMix(fill);
  const source = isChipFillToken(fill) || !fill ? "var(--ds-chip-fill)" : fill;
  return {
    "--ds-chip-ink": ink,
    "--ds-chip-border": `color-mix(in oklch, ${source} 68%, ${ink})`,
    "--ds-chip-text": `color-mix(in oklch, ${source} 38%, ${ink})`,
  } as CSSProperties;
}

/** Qualquer cor (token DS ou CSS). Tokens usam data-fill; o resto vai em --ds-chip-fill. */
export function chipSurfaceProps(fill: ChipFillToken | string | null | undefined) {
  const contrast = chipContrastStyle(fill);
  if (!fill) return { className: CHIP_SURFACE_CLASS, style: contrast };
  if (isChipFillToken(fill)) {
    return { className: CHIP_SURFACE_CLASS, "data-fill": fill, style: contrast };
  }
  return {
    className: CHIP_SURFACE_CLASS,
    style: { "--ds-chip-fill": fill, ...contrast } as CSSProperties,
  };
}

export function taskChipProps(fill: ChipFillToken | string | null | undefined) {
  const surface = chipSurfaceProps(fill);
  return { ...surface, className: TASK_CHIP_CLASS };
}

export function pillChipProps(fill: ChipFillToken | string | null | undefined) {
  const surface = chipSurfaceProps(fill);
  return { ...surface, className: PILL_CHIP_CLASS };
}

/**
 * Luminância do fundo → L de borda/texto (color-mix ~32% / ~62% rumo ao ink).
 * L > 0.5 misture com preto; senão com branco.
 */
export function contrastLuminance(fillL: number, role: "border" | "text"): number {
  const ink = fillL > 0.5 ? 0 : 1;
  const amount = role === "border" ? 0.32 : 0.62;
  return fillL * (1 - amount) + ink * amount;
}

type ChipShape = "chip" | "pill";

type ChipOwnProps<T extends ElementType> = {
  as?: T;
  /** Token DS (`signal-wash`) ou qualquer CSS (`hsl(...)`, `oklch(...)`). */
  fill?: ChipFillToken | string | null;
  shape?: ChipShape;
};

export type TaskChipProps<T extends ElementType = "span"> = ChipOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ChipOwnProps<T>>;

export function TaskChip<T extends ElementType = "span">({
  as,
  fill,
  shape = "chip",
  className,
  style,
  ...props
}: TaskChipProps<T>) {
  const Comp = (as ?? "span") as ElementType;
  const surface = chipSurfaceProps(fill);
  return (
    <Comp
      className={cn(shape === "pill" ? PILL_CHIP_CLASS : TASK_CHIP_CLASS, className)}
      data-fill={"data-fill" in surface ? surface["data-fill"] : undefined}
      style={{ ...("style" in surface ? surface.style : undefined), ...style }}
      {...props}
    />
  );
}
