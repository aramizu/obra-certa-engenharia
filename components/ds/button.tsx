import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, iconStroke } from "./cn";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-display uppercase tracking-wider font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "disabled:pointer-events-none disabled:opacity-50 active:translate-x-px active:translate-y-px",
    iconStroke
  ),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-graphite hover:bg-primary-hover",
        destructive:
          "bg-delay text-delay-ink border-2 border-graphite hover:bg-delay-wash hover:text-delay",
        outline:
          "border-2 border-graphite bg-white text-foreground hover:bg-concrete",
        secondary:
          "border-2 border-graphite bg-concrete text-foreground hover:bg-white",
        ghost:
          "border-2 border-transparent bg-transparent text-foreground hover:bg-concrete hover:border-graphite",
        link: "text-blueprint underline-offset-4 hover:underline tracking-normal font-sans font-medium normal-case",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
