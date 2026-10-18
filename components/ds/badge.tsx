import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";
import { PILL_CHIP_CLASS, chipContrastStyle, type ChipFillToken } from "./chip";

const badgeVariants = cva(
  `${PILL_CHIP_CLASS} inline-flex items-center px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-widest`,
  {
    variants: {
      tone: {
        graphite: "",
        safety: "",
        signal: "",
        blueprint: "",
        done: "",
        delay: "",
        high: "",
        medium: "",
        low: "",
        normal: "",
        overdue: "",
        quoted: "",
        purchased: "",
      },
    },
    defaultVariants: {
      tone: "graphite",
    },
  }
);

export const BADGE_TONE_FILL: Record<NonNullable<VariantProps<typeof badgeVariants>["tone"]>, ChipFillToken> = {
  graphite: "white",
  safety: "primary",
  signal: "signal",
  blueprint: "blueprint",
  done: "done-wash",
  delay: "delay",
  high: "delay-wash",
  medium: "signal-wash",
  low: "blueprint-wash",
  normal: "concrete",
  overdue: "delay",
  quoted: "signal-wash",
  purchased: "done-wash",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone = "graphite", style, ...props }: BadgeProps) {
  const resolved = tone ?? "graphite";
  const fill = BADGE_TONE_FILL[resolved];
  return (
    <span
      className={cn(badgeVariants({ tone: resolved }), className)}
      data-fill={fill}
      style={{ ...chipContrastStyle(fill), ...style }}
      {...props}
    />
  );
}

export { badgeVariants };
