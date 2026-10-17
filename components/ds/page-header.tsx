import type { ReactNode } from "react";
import { Stamp } from "./stamp";
import { cn, iconStroke } from "./cn";

export function PageHeader({
  title,
  description,
  stamp = "OC-01",
  breadcrumb,
  actions,
  menuButton,
  className,
}: {
  title: string;
  description?: string;
  stamp?: string;
  breadcrumb?: string;
  actions?: ReactNode;
  menuButton?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative z-50 border-b-2 border-graphite bg-white", className)}>
      <div className="ds-hazard-orange h-1.5 w-full" />
      <div className="flex items-center gap-4 px-4 py-4 lg:px-8">
        {menuButton}
        <div className="flex-1 min-w-0">
          {breadcrumb && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">
              {breadcrumb}
            </p>
          )}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-heading text-foreground truncate">{title}</h1>
            <Stamp className="hidden sm:inline-flex shrink-0">{stamp}</Stamp>
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground truncate">{description}</p>
          )}
        </div>
        {actions && <div className={cn("hidden sm:flex items-center gap-2", iconStroke)}>{actions}</div>}
      </div>
    </div>
  );
}
