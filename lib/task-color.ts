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
  bar: string;
  chip: string;
  accent: string;
  swatch: string;
  dot: string;
}[] = [
  {
    id: "safety",
    label: "Segurança",
    bar: "rounded-md bg-primary/15 text-primary border-2 border-primary",
    chip: "rounded-full bg-primary/15 text-primary border-2 border-primary",
    accent: "bg-primary",
    swatch: "bg-primary",
    dot: "bg-primary",
  },
  {
    id: "signal",
    label: "Sinalização",
    bar: "rounded-md bg-signal-wash text-signal-ink border-2 border-signal",
    chip: "rounded-full bg-signal-wash text-signal-ink border-2 border-signal",
    accent: "bg-signal",
    swatch: "bg-signal",
    dot: "bg-signal",
  },
  {
    id: "blueprint",
    label: "Planta",
    bar: "rounded-md bg-blueprint-wash text-blueprint border-2 border-blueprint",
    chip: "rounded-full bg-blueprint-wash text-blueprint border-2 border-blueprint",
    accent: "bg-blueprint",
    swatch: "bg-blueprint",
    dot: "bg-blueprint",
  },
  {
    id: "done",
    label: "Concluído",
    bar: "rounded-md bg-done-wash text-done border-2 border-done",
    chip: "rounded-full bg-done-wash text-done border-2 border-done",
    accent: "bg-done",
    swatch: "bg-done",
    dot: "bg-done",
  },
  {
    id: "delay",
    label: "Atraso",
    bar: "rounded-md bg-delay-wash text-delay border-2 border-delay",
    chip: "rounded-full bg-delay-wash text-delay border-2 border-delay",
    accent: "bg-delay",
    swatch: "bg-delay",
    dot: "bg-delay",
  },
  {
    id: "graphite",
    label: "Grafite",
    bar: "rounded-md bg-concrete text-foreground border-2 border-graphite",
    chip: "rounded-full bg-concrete text-foreground border-2 border-graphite",
    accent: "bg-graphite",
    swatch: "bg-graphite",
    dot: "bg-graphite",
  },
  {
    id: "paper",
    label: "Papel",
    bar: "rounded-md bg-paper text-foreground border-2 border-graphite-2",
    chip: "rounded-full bg-paper text-foreground border-2 border-graphite-2",
    accent: "bg-graphite-2",
    swatch: "bg-paper border border-graphite",
    dot: "bg-paper border border-graphite",
  },
  {
    id: "concrete",
    label: "Concreto",
    bar: "rounded-md bg-concrete text-foreground border-2 border-graphite-2",
    chip: "rounded-full bg-concrete text-foreground border-2 border-graphite-2",
    accent: "bg-graphite-2",
    swatch: "bg-concrete border border-graphite",
    dot: "bg-concrete border border-graphite",
  },
  {
    id: "sand",
    label: "Areia",
    bar: "rounded-md bg-background text-foreground border-2 border-graphite",
    chip: "rounded-full bg-background text-foreground border-2 border-graphite",
    accent: "bg-graphite-2",
    swatch: "bg-background border border-graphite",
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
