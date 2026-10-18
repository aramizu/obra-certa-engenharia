import { priorityChip } from "@/lib/task-priority";

export function PriorityTag({ taskType }: { taskType: string | null | undefined }) {
  const chip = priorityChip(taskType);
  if (!chip) return null;
  return (
    <span className={chip.className} data-fill={chip.fill} style={chip.style}>
      {chip.label}
    </span>
  );
}
