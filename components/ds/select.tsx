import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn, iconStroke, selectTriggerClass } from "./cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span className={cn("relative inline-flex w-full min-w-0 items-center", iconStroke, className)}>
        <select
          className={cn(selectTriggerClass, "w-full", className)}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground"
        />
      </span>
    );
  }
);
Select.displayName = "Select";

export { Select };
