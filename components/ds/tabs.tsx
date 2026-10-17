"use client";

import { cn } from "./cn";

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
    <div className={cn("inline-flex overflow-hidden rounded-lg border-2 border-graphite bg-white", className)} role="tablist">
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              "px-3 py-1.5 font-display text-xs uppercase tracking-widest",
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
