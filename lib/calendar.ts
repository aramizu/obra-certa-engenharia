import { PILL_CHIP_CLASS, TASK_CHIP_CLASS, type ChipFillToken } from "@/components/ds/chip";
import { addDays, eachDay, formatISODate, startOfDay } from "./date";
import type { Task } from "./db/schema";

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function startOfWeekSunday(date: Date): Date {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = startOfWeekSunday(first);
  return eachDay(start, addDays(start, 41));
}

export function weekGrid(anchor: Date): Date[] {
  const start = startOfWeekSunday(anchor);
  return eachDay(start, addDays(start, 6));
}

export function taskOccursOn(
  task: Pick<Task, "startDate" | "dueDate" | "endDate">,
  isoDate: string
) {
  const start = task.startDate;
  const due = task.dueDate || task.endDate;
  if (start && due) return isoDate >= start && isoDate <= due;
  if (due) return isoDate === due;
  if (start) return isoDate === start;
  return false;
}

export function isAssignedToUser(task: { assignee: string | null }, userName: string) {
  const assignee = (task.assignee || "").trim().toLowerCase();
  if (!assignee) return true;
  const name = userName.trim().toLowerCase();
  const first = name.split(" ")[0];
  return assignee === name || assignee.includes(name) || (first.length > 1 && assignee.includes(first));
}

export function isDoneColumn(columnName: string | null | undefined) {
  if (!columnName) return false;
  const normalized = columnName.toLowerCase();
  return normalized.includes("conclu") || normalized.includes("feito");
}

export function isOverdueTask(
  task: Pick<Task, "dueDate" | "endDate" | "isMilestone">,
  columnName: string | null | undefined,
  todayIso: string
) {
  if (isDoneColumn(columnName)) return false;
  const due = task.dueDate || task.endDate;
  return Boolean(due && due < todayIso);
}

export type BadgeTone = "high" | "medium" | "low" | "normal" | "milestone" | "overdue" | "done";

export function taskBadgeTone(
  task: Pick<Task, "taskType" | "isMilestone" | "dueDate" | "endDate">,
  columnName: string | null | undefined,
  todayIso: string
): BadgeTone {
  if (isOverdueTask(task, columnName, todayIso)) return "overdue";
  if (isDoneColumn(columnName)) return "done";
  if (task.isMilestone) return "milestone";
  if (task.taskType === "high") return "high";
  if (task.taskType === "medium") return "medium";
  if (task.taskType === "low") return "low";
  return "normal";
}

export const BADGE_FILL: Record<BadgeTone, ChipFillToken> = {
  high: "delay-wash",
  medium: "signal-wash",
  low: "blueprint-wash",
  normal: "white",
  milestone: "primary",
  overdue: "delay",
  done: "done-wash",
};

export const BADGE_CLASS: Record<BadgeTone, string> = {
  high: PILL_CHIP_CLASS,
  medium: PILL_CHIP_CLASS,
  low: PILL_CHIP_CLASS,
  normal: PILL_CHIP_CLASS,
  milestone: `${PILL_CHIP_CLASS} font-semibold`,
  overdue: PILL_CHIP_CLASS,
  done: `${PILL_CHIP_CLASS} line-through`,
};

export const DOT_CLASS: Record<BadgeTone, string> = {
  high: "bg-delay",
  medium: "bg-signal",
  low: "bg-blueprint",
  normal: "bg-graphite-2",
  milestone: "bg-primary",
  overdue: "bg-delay",
  done: "bg-done",
};

/** Same palette as calendar badges, as opaque Gantt bars (raio de tarefa, não pílula). */
export const GANTT_BAR_CLASS: Record<BadgeTone, string> = {
  high: TASK_CHIP_CLASS,
  medium: TASK_CHIP_CLASS,
  low: TASK_CHIP_CLASS,
  normal: TASK_CHIP_CLASS,
  milestone: `${TASK_CHIP_CLASS} font-semibold`,
  overdue: TASK_CHIP_CLASS,
  done: TASK_CHIP_CLASS,
};

export function badgeChipProps(tone: BadgeTone) {
  return { className: BADGE_CLASS[tone], "data-fill": BADGE_FILL[tone] };
}

export function ganttBarChipProps(tone: BadgeTone) {
  return { className: GANTT_BAR_CLASS[tone], "data-fill": BADGE_FILL[tone] };
}

export const GANTT_MILESTONE_CLASS: Record<BadgeTone, string> = {
  high: "bg-delay border-graphite",
  medium: "bg-signal border-graphite",
  low: "bg-blueprint border-graphite",
  normal: "bg-graphite-2 border-graphite",
  milestone: "bg-primary border-graphite",
  overdue: "bg-delay border-graphite",
  done: "bg-done border-graphite",
};

export const GANTT_MIN_INNER_LABEL_PX = 80;

export function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function ganttLabelFitsInside(widthPx: number) {
  return widthPx >= GANTT_MIN_INNER_LABEL_PX;
}

export function formatGanttDateRange(start: Date, end: Date, milestone?: boolean) {
  const startLabel = start.toLocaleDateString("pt-BR");
  if (milestone || start.getTime() === end.getTime()) return startLabel;
  return `${startLabel} – ${end.toLocaleDateString("pt-BR")}`;
}
