import type { ReactNode } from "react";
import { cn } from "./cn";
import { HelmetMark, PlanMark, TapeMark } from "./illustrations";

const marks = {
  helmet: HelmetMark,
  tape: TapeMark,
  plan: PlanMark,
};

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: keyof typeof marks;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  illustration = "helmet",
  className,
}: EmptyStateProps) {
  const Mark = marks[illustration];
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-12 gap-4", className)}>
      <div className="ds-hazard h-2 w-28" />
      <div className="flex h-20 w-20 items-center justify-center border-2 border-graphite bg-white text-primary ds-shadow">
        <Mark className="h-12 w-12" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-title text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
