import { cn } from "./cn";

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
        "inline-flex items-center border-2 border-graphite bg-white px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
