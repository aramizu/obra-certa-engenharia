import { addDays, formatISODate, parseISODate } from "./date";
import type { Task, TaskDependency } from "./db/schema";

export function isMilestoneTask(task: Pick<Task, "isMilestone" | "taskType">) {
  return task.isMilestone || task.taskType === "milestone";
}

export function taskSchedule(task: Pick<Task, "startDate" | "dueDate" | "endDate" | "isMilestone" | "taskType">) {
  const milestone = isMilestoneTask(task);
  const startIso = task.startDate || task.dueDate || task.endDate;
  const endIso = task.dueDate || task.endDate || task.startDate;
  if (!startIso && !endIso) return null;
  const start = parseISODate(startIso || endIso!);
  const end = parseISODate(endIso || startIso!);
  if (milestone || end < start) {
    return { start, end: start, milestone: true };
  }
  return { start, end, milestone };
}

export function shiftSchedule(start: Date, end: Date, dayDelta: number, mode: "move" | "resize-start" | "resize-end", milestone: boolean) {
  if (milestone || mode === "move") {
    const nextStart = addDays(start, dayDelta);
    const duration = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    return {
      startDate: formatISODate(nextStart),
      dueDate: formatISODate(addDays(nextStart, milestone ? 0 : duration)),
    };
  }
  if (mode === "resize-start") {
    const nextStart = addDays(start, dayDelta);
    const clamped = nextStart > end ? end : nextStart;
    return { startDate: formatISODate(clamped), dueDate: formatISODate(end) };
  }
  const nextEnd = addDays(end, dayDelta);
  const clamped = nextEnd < start ? start : nextEnd;
  return { startDate: formatISODate(start), dueDate: formatISODate(clamped) };
}

export function dependencyConflict(
  successor: Pick<Task, "startDate" | "dueDate" | "endDate" | "isMilestone" | "taskType">,
  predecessor: Pick<Task, "startDate" | "dueDate" | "endDate" | "isMilestone" | "taskType">
) {
  const succ = taskSchedule(successor);
  const pred = taskSchedule(predecessor);
  if (!succ || !pred) return false;
  return succ.start < pred.end;
}

export function wouldCreateCycle(deps: TaskDependency[], taskId: string, dependsOnTaskId: string) {
  if (taskId === dependsOnTaskId) return true;
  const successors = new Map<string, string[]>();
  for (const dep of deps) {
    const list = successors.get(dep.dependsOnTaskId) ?? [];
    list.push(dep.taskId);
    successors.set(dep.dependsOnTaskId, list);
  }
  const stack = [taskId];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === dependsOnTaskId) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of successors.get(node) ?? []) stack.push(next);
  }
  return false;
}
