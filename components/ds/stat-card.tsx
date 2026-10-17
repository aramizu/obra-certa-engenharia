import type { ReactNode } from "react";
import { Card } from "./card";
import { ProgressBar } from "./progress";
import { Stamp } from "./stamp";
import { cn } from "./cn";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  progress?: number;
  stamp?: string;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  hint,
  progress,
  stamp = "KPI",
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b-2 border-graphite bg-blueprint-wash px-4 py-2">
        <p className="text-label m-0">{label}</p>
        <Stamp>{stamp}</Stamp>
      </div>
      <div className="p-4 space-y-3">
        <div className={cn("font-mono text-3xl font-semibold tabular-nums leading-none", valueClassName)}>
          {value}
        </div>
        {typeof progress === "number" && <ProgressBar value={progress} />}
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </Card>
  );
}
