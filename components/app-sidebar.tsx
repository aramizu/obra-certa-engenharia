"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type RefObject } from "react";
import {
  Home,
  Building2,
  DollarSign,
  Package,
  KanbanSquare,
  GanttChart,
  Calendar,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  userName: string;
  variant?: "desktop" | "mobile";
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  { name: "Painel", href: "/", icon: Home, available: true },
  { name: "Obras", href: "/obras", icon: Building2, available: true },
  { name: "Fornecedores", href: "/fornecedores", icon: Package, available: true },
  { name: "Kanban", href: "/kanban", icon: KanbanSquare, available: true },
  { name: "Gantt", href: "/gantt", icon: GanttChart, available: false },
  { name: "Calendário", href: "/calendario", icon: Calendar, available: false },
];

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function SidebarPanel({
  userName,
  onNavigate,
  showCloseButton,
  closeButtonRef,
}: {
  userName: string;
  onNavigate?: () => void;
  showCloseButton?: boolean;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white text-foreground">
      <div className="border-b p-6 flex items-center justify-between">
        <h1 className="text-title text-primary flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-accent" />
          Obra Certa
        </h1>
        {showCloseButton && (
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onNavigate}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto" aria-label="Principal">
        {navigation.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.available ? item.href : "#"}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : item.available
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "text-muted-foreground/40 cursor-not-allowed"
              )}
              onClick={(e) => {
                if (!item.available) {
                  e.preventDefault();
                  return;
                }
                onNavigate?.();
              }}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
              {!item.available && (
                <span className="ml-auto text-xs">(em breve)</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{userName}</p>
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
      <aside className="hidden lg:flex h-screen shrink-0">
        <SidebarPanel userName={userName} />
      </aside>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="lg:hidden absolute inset-0 z-40 flex">
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
        className="relative z-10 h-full shadow-lg animate-in slide-in-from-left duration-200"
      >
        <SidebarPanel
          userName={userName}
          onNavigate={onClose}
          showCloseButton
          closeButtonRef={closeButtonRef}
        />
      </div>
    </div>
  );
}
