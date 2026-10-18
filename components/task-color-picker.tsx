"use client";

import { cn } from "@/components/ds";
import { DEFAULT_TASK_COLOR, TASK_COLORS, type TaskColorId } from "@/lib/task-color";

export function TaskColorPicker({
  value,
  onChange,
  disabled,
}: {
  value: TaskColorId;
  onChange: (value: TaskColorId) => void;
  disabled?: boolean;
}) {
  const selected = value || DEFAULT_TASK_COLOR;

  return (
    <div role="radiogroup" aria-label="Cor da tarefa" className="flex flex-wrap gap-2">
      {TASK_COLORS.map((color) => {
        const isSelected = color.id === selected;
        return (
          <button
            key={color.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={color.label}
            title={color.label}
            disabled={disabled}
            onClick={() => onChange(color.id)}
            className={cn(
              "h-8 w-8 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              color.swatch,
              isSelected ? "border-graphite ring-2 ring-primary ring-offset-2" : "border-graphite/40"
            )}
          />
        );
      })}
    </div>
  );
}
