import Link from "next/link";
import { cn, chipContrastStyle } from "@/components/ds";
import { OBRA_FILTER_ALL, OBRA_FILTER_NONE, SEM_OBRA_LABEL, type ObraFilter } from "@/lib/user-tasks";

export function ObraFilterBar({
  projects,
  value,
  basePath,
}: {
  projects: { id: string; name: string }[];
  value: ObraFilter;
  basePath: string;
}) {
  const items: { href: string; label: string; active: boolean }[] = [
    { href: basePath, label: "Todas", active: value === OBRA_FILTER_ALL },
    { href: `${basePath}?obra=none`, label: SEM_OBRA_LABEL, active: value === OBRA_FILTER_NONE },
    ...projects.map((project) => ({
      href: `${basePath}?obra=${project.id}`,
      label: project.name,
      active: value === project.id,
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Obra</span>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch
          className={cn(
            "ds-chip-surface ds-chip-pill px-2.5 py-1 text-xs font-display uppercase tracking-wide",
            item.active ? "" : "opacity-80 hover:opacity-100"
          )}
          data-fill={item.active ? "primary-wash" : "concrete"}
          style={chipContrastStyle(item.active ? "primary-wash" : "concrete")}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
