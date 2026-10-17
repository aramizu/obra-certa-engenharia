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

export const BADGE_CLASS: Record<BadgeTone, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-900 border-amber-200",
  low: "bg-sky-100 text-sky-800 border-sky-200",
  normal: "bg-neutral-100 text-neutral-800 border-neutral-200",
  milestone: "bg-orange-100 text-orange-900 border-orange-300 font-semibold",
  overdue: "bg-destructive text-destructive-foreground border-destructive",
  done: "bg-emerald-50 text-emerald-800 border-emerald-200 line-through opacity-80",
};

export const DOT_CLASS: Record<BadgeTone, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-sky-500",
  normal: "bg-neutral-400",
  milestone: "bg-accent",
  overdue: "bg-destructive",
  done: "bg-emerald-500",
};
