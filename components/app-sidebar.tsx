"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Building2, 
  DollarSign, 
  Package, 
  KanbanSquare, 
  GanttChart, 
  Calendar,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  userName: string;
}

const navigation = [
  { name: "Painel", href: "/", icon: Home, available: true },
  { name: "Obras", href: "/obras", icon: Building2, available: true },
  { name: "Fornecedores", href: "/fornecedores", icon: Package, available: true },
  { name: "Kanban", href: "/kanban", icon: KanbanSquare, available: false },
  { name: "Gantt", href: "/gantt", icon: GanttChart, available: false },
  { name: "Calendário", href: "/calendario", icon: Calendar, available: false },
];

export function AppSidebar({ userName }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b p-6">
        <h1 className="text-title text-primary flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-accent" />
          Obra Certa
        </h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
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
                }
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
