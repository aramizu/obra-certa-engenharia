import { cn } from "./cn";
import { PILL_CHIP_CLASS, chipContrastStyle } from "./chip";

export function Stamp({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        PILL_CHIP_CLASS,
        "inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
        className
      )}
      data-fill="white"
      style={chipContrastStyle("white")}
    >
      {children}
    </span>
  );
}
