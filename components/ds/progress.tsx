import { cn } from "./cn";

interface ProgressBarProps {
  value: number;
  className?: string;
  tone?: "safety" | "delay" | "done" | "blueprint";
}

export function ProgressBar({ value, className, tone }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(value, 100));
  const over = value > 100;
  const fill = over || tone === "delay"
    ? "bg-delay"
    : tone === "done"
      ? "bg-done"
      : tone === "blueprint"
        ? "bg-blueprint"
        : "bg-primary";

  return (
    <div className={cn("relative h-3 w-full border-2 border-graphite bg-white", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full", fill)} style={{ width: `${pct}%` }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0, transparent calc(10% - 1px), var(--graphite) calc(10% - 1px), var(--graphite) 10%)",
        }}
      />
    </div>
  );
}
