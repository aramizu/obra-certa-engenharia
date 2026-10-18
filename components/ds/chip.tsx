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

export function isChipFillToken(value: unknown): value is ChipFillToken {
  return typeof value === "string" && (CHIP_FILL_TOKENS as readonly string[]).includes(value);
}

/** Qualquer cor (token DS ou CSS). Tokens usam data-fill; o resto vai em --ds-chip-fill. */
export function chipSurfaceProps(fill: ChipFillToken | string | null | undefined) {
  if (!fill) return { className: CHIP_SURFACE_CLASS };
  if (isChipFillToken(fill)) {
    return { className: CHIP_SURFACE_CLASS, "data-fill": fill };
  }
  return {
    className: CHIP_SURFACE_CLASS,
    style: { "--ds-chip-fill": fill } as CSSProperties,
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
 * Luminância do fundo → L de borda/texto na mesma matiz.
 * L > 0.5 escurece; senão clareia. Espelha o `oklch(from …)` em globals.css.
 */
export function contrastLuminance(fillL: number, role: "border" | "text"): number {
  const k = role === "border" ? 1.2 : 1.5;
  const lo = role === "border" ? 0.18 : 0.12;
  const hi = role === "border" ? 0.88 : 0.98;
  return Math.min(hi, Math.max(lo, 0.5 + (0.5 - fillL) * k));
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
