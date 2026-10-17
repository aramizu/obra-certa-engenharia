import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const badgeVariants = cva(
  "inline-flex items-center border-2 px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-widest",
  {
    variants: {
      tone: {
        graphite: "border-graphite bg-white text-foreground",
        safety: "border-graphite bg-primary text-primary-foreground",
        signal: "border-graphite bg-signal text-signal-ink",
        blueprint: "border-graphite bg-blueprint text-blueprint-ink",
        done: "border-done bg-done-wash text-done",
        delay: "border-delay bg-delay text-delay-ink",
        high: "border-delay bg-delay-wash text-delay",
        medium: "border-graphite bg-signal-wash text-signal-ink",
        low: "border-blueprint bg-blueprint-wash text-blueprint",
        normal: "border-graphite bg-concrete text-foreground",
        milestone: "border-graphite bg-primary text-primary-foreground",
        overdue: "border-delay bg-delay text-delay-ink",
        quoted: "border-graphite bg-signal-wash text-signal-ink",
        purchased: "border-done bg-done-wash text-done",
      },
    },
    defaultVariants: {
      tone: "graphite",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
