import { TASK_CHIP_CLASS, type ChipFillToken } from "@/components/ds/chip";

export const TASK_COLOR_IDS = [
  "safety",
  "signal",
  "blueprint",
  "done",
  "delay",
  "graphite",
  "paper",
  "concrete",
  "sand",
] as const;

export type TaskColorId = (typeof TASK_COLOR_IDS)[number];

/** Padrão do seletor (laranja de segurança). `null` no banco cai neste id. */
export const DEFAULT_TASK_COLOR: TaskColorId = "safety";

export const TASK_COLORS: {
  id: TaskColorId;
  label: string;
  fill: ChipFillToken;
  bar: string;
  chip: string;
  accent: string;
  swatch: ChipFillToken;
  dot: string;
}[] = [
  {
    id: "safety",
    label: "Segurança",
    fill: "primary-wash",
    bar: TASK_CHIP_CLASS,
    chip: TASK_CHIP_CLASS,
    accent: "bg-primary",
    swatch: "primary",
    dot: "bg-primary",
  },
  {
    id: "signal",
    label: "Sinalização",
    fill: "signal-wash",
    bar: TASK_CHIP_CLASS,
    chip: TASK_CHIP_CLASS,
    accent: "bg-signal",
    swatch: "signal",
    dot: "bg-signal",
  },
  {
    id: "blueprint",
    label: "Planta",
    fill: "blueprint-wash",
    bar: TASK_CHIP_CLASS,
    chip: TASK_CHIP_CLASS,
    accent: "bg-blueprint",
    swatch: "blueprint",
    dot: "bg-blueprint",
  },
  {
    id: "done",
    label: "Concluído",
    fill: "done-wash",
    bar: TASK_CHIP_CLASS,
    chip: TASK_CHIP_CLASS,
    accent: "bg-done",
    swatch: "done",
    dot: "bg-done",
  },
  {
    id: "delay",
    label: "Atraso",
    fill: "delay-wash",
    bar: TASK_CHIP_CLASS,
    chip: TASK_CHIP_CLASS,
    accent: "bg-delay",
    swatch: "delay",
    dot: "bg-delay",
  },
  {
    id: "graphite",
    label: "Grafite",
    fill: "concrete",
    bar: TASK_CHIP_CLASS,
    chip: TASK_CHIP_CLASS,
    accent: "bg-graphite",
    swatch: "graphite",
    dot: "bg-graphite",
  },
  {
    id: "paper",
    label: "Papel",
    fill: "paper",
    bar: TASK_CHIP_CLASS,
    chip: TASK_CHIP_CLASS,
    accent: "bg-graphite-2",
    swatch: "paper",
    dot: "bg-paper border border-graphite",
  },
  {
    id: "concrete",
    label: "Concreto",
    fill: "concrete",
    bar: TASK_CHIP_CLASS,
    chip: TASK_CHIP_CLASS,
    accent: "bg-graphite-2",
    swatch: "concrete",
    dot: "bg-concrete border border-graphite",
  },
  {
    id: "sand",
    label: "Areia",
    fill: "background",
    bar: TASK_CHIP_CLASS,
    chip: TASK_CHIP_CLASS,
    accent: "bg-graphite-2",
    swatch: "background",
    dot: "bg-background border border-graphite",
  },
];

const BY_ID = Object.fromEntries(TASK_COLORS.map((item) => [item.id, item])) as Record<
  TaskColorId,
  (typeof TASK_COLORS)[number]
>;

export function isTaskColorId(value: unknown): value is TaskColorId {
  return typeof value === "string" && (TASK_COLOR_IDS as readonly string[]).includes(value);
}

/** `null`/inválido → cor padrão (swatch do seletor). */
export function resolveTaskColorId(color: string | null | undefined): TaskColorId {
  return isTaskColorId(color) ? color : DEFAULT_TASK_COLOR;
}

export function taskColorStyle(color: string | null | undefined) {
  return BY_ID[resolveTaskColorId(color)];
}

/** Create: missing/blank → default. PATCH invalid → error via null return of parse. */
export function parseTaskColorInput(value: unknown, mode: "create" | "patch"): TaskColorId | null | undefined {
  if (value === undefined) return mode === "create" ? DEFAULT_TASK_COLOR : undefined;
  if (value === null || value === "") return mode === "create" ? DEFAULT_TASK_COLOR : null;
  if (!isTaskColorId(value)) return null;
  return value;
}
