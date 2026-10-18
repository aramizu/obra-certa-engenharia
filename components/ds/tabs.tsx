"use client";

import { cn } from "./cn";

/** Grupo: padding 4px + gap; raio interno = lg (16px) − padding = md (12px). */
export const TABS_GROUP_CLASS =
  "inline-flex gap-1 rounded-lg border-2 border-graphite bg-white p-1";
export const TABS_TAB_CLASS =
  "rounded-md px-3 py-1.5 font-display text-xs uppercase tracking-widest";

export function Tabs({
  value,
  onChange,
  items,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn(TABS_GROUP_CLASS, className)} role="tablist">
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              TABS_TAB_CLASS,
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-white text-foreground hover:bg-concrete"
            )}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
