"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  title: string;
  description?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function AppHeader({ title, description, onMenuToggle, isMenuOpen = false }: AppHeaderProps) {
  return (
    <div className="relative z-50 border-b bg-white">
      <div className="flex items-center gap-4 px-4 py-6 lg:px-8">
        {onMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden shrink-0"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMenuOpen}
            aria-controls="app-sidebar"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-heading text-primary truncate">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
