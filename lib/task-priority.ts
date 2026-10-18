import { TASK_CHIP_CLASS, chipContrastStyle, type ChipFillToken } from "@/components/ds/chip";

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

/** Baixa = verde suave, Média = âmbar, Alta = vermelho. */
export const PRIORITY_FILL: Record<TaskPriority, ChipFillToken> = {
  low: "done-wash",
  medium: "signal-wash",
  high: "delay-wash",
};

export function isTaskPriority(value: string | null | undefined): value is TaskPriority {
  return value === "low" || value === "medium" || value === "high";
}

export function priorityChip(taskType: string | null | undefined) {
  if (!isTaskPriority(taskType)) return null;
  const fill = PRIORITY_FILL[taskType];
  return {
    label: PRIORITY_LABELS[taskType],
    fill,
    className: `${TASK_CHIP_CLASS} inline-flex shrink-0 text-[10px] font-display uppercase tracking-wide px-2 py-0.5`,
    style: chipContrastStyle(fill),
  };
}
