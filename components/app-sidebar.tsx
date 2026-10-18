"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import {
  Home,
  Building2,
  HardHat,
  Package,
  KanbanSquare,
  GanttChart,
  Calendar,
  StickyNote,
  LogOut,
  X,
  Ruler,
  Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stamp } from "@/components/ds";
import { cn, iconStroke } from "@/components/ds/cn";

interface AppSidebarProps {
  userName: string;
  isAdmin?: boolean;
  variant?: "desktop" | "mobile";
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  { name: "Painel", href: "/", icon: Home },
  { name: "Obras", href: "/obras", icon: Building2 },
  { name: "Fornecedores", href: "/fornecedores", icon: Package },
  { name: "Kanban", href: "/kanban", icon: KanbanSquare },
  { name: "Gantt", href: "/gantt", icon: GanttChart },
  { name: "Calendário", href: "/calendario", icon: Calendar },
  { name: "Post-its", href: "/post-its", icon: StickyNote },
  { name: "Sistema", href: "/design-system", icon: Ruler },
];

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function NavItemStatus({
  isActive,
  children,
}: {
  isActive: boolean;
  children: ReactNode;
}) {
  const { pending } = useLinkStatus();
  const highlight = isActive || pending;

  return (
    <span
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        highlight
          ? "bg-concrete text-foreground"
          : "text-muted-foreground hover:bg-concrete hover:text-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
      data-pending={pending ? "true" : undefined}
    >
      {children}
    </span>
  );
}

function SidebarPanel({
  userName,
  isAdmin = false,
  onNavigate,
  showCloseButton,
  closeButtonRef,
}: {
  userName: string;
  isAdmin?: boolean;
  onNavigate?: () => void;
  showCloseButton?: boolean;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...navigation, { name: "Base SINAPI", href: "/admin/base", icon: Library }]
    : navigation;

  return (
    <div className="flex h-full w-64 flex-col border-r-2 border-graphite bg-white text-foreground pointer-events-auto">
      <div className="ds-hazard-orange h-1.5 w-full" />
      <div className="border-b-2 border-graphite p-5 flex items-center justify-between bg-blueprint-wash">
        <div className="min-w-0">
          <p className="text-title text-foreground flex items-center gap-2">
            <HardHat className="h-5 w-5 text-primary" strokeWidth={2.25} />
            Obra Certa
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            Engenharia
          </p>
        </div>
        {showCloseButton && (
          <Button
            ref={closeButtonRef}
            variant="outline"
            size="icon"
            onClick={onNavigate}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className={cn("flex-1 space-y-0.5 p-3 overflow-y-auto", iconStroke)} aria-label="Principal">
        {items.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch
              className="block"
              onClick={onNavigate}
            >
              <NavItemStatus isActive={isActive}>
                <Icon className="h-5 w-5" />
                <span className="font-display uppercase tracking-wider text-xs">{item.name}</span>
              </NavItemStatus>
            </Link>
          );
        })}
      </nav>

      <div className="border-t-2 border-graphite p-4 bg-white">
        <div className="mb-3 flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-graphite bg-primary text-primary-foreground font-display text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{userName}</p>
            <Stamp>CREA</Stamp>
          </div>
        </div>
        <form action="/api/auth/sair" method="POST">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AppSidebar({
  userName,
  isAdmin = false,
  variant = "desktop",
  isOpen = false,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (variant !== "mobile") return;
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    onClose?.();
  }, [pathname, onClose, variant]);

  useEffect(() => {
    if (variant !== "mobile" || !isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const media = window.matchMedia("(min-width: 1024px)");
    const handleBreakpoint = () => {
      if (media.matches) onClose?.();
    };
    media.addEventListener("change", handleBreakpoint);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      media.removeEventListener("change", handleBreakpoint);
      document.body.style.overflow = "";
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose, variant]);

  if (variant === "desktop") {
    return (
      <aside className="hidden lg:flex h-screen shrink-0 z-30 relative pointer-events-auto">
        <SidebarPanel userName={userName} isAdmin={isAdmin} />
      </aside>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="lg:hidden absolute inset-0 z-40 flex pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="app-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className="relative z-10 h-full ds-shadow"
      >
        <SidebarPanel
          userName={userName}
          isAdmin={isAdmin}
          onNavigate={onClose}
          showCloseButton
          closeButtonRef={closeButtonRef}
        />
      </div>
    </div>
  );
}
