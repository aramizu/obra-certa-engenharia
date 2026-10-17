import type { ReactNode } from "react";
import { cn } from "./cn";

interface AlertProps {
  children: ReactNode;
  className?: string;
  tone?: "warning" | "danger" | "info" | "success";
  title?: string;
}

const tones = {
  warning: "border-graphite bg-signal-wash text-signal-ink",
  danger: "border-delay bg-delay-wash text-delay",
  info: "border-blueprint bg-blueprint-wash text-blueprint",
  success: "border-done bg-done-wash text-done",
};

export function Alert({ children, className, tone = "warning", title }: AlertProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border-2 bg-white text-sm", tones[tone], className)} role="alert">
      <div className="ds-hazard h-2 w-full" />
      <div className="px-4 py-3">
        {title && <p className="text-label mb-1 text-inherit">{title}</p>}
        {children}
      </div>
    </div>
  );
}
