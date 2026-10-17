"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ds";

interface AppHeaderProps {
  title: string;
  description?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function AppHeader({ title, description, onMenuToggle, isMenuOpen = false }: AppHeaderProps) {
  return (
    <PageHeader
      title={title}
      description={description}
      stamp="OC-01"
      breadcrumb="Obra Certa Engenharia / Canteiro"
      menuButton={
        onMenuToggle ? (
          <Button
            variant="outline"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden shrink-0"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMenuOpen}
            aria-controls="app-sidebar"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        ) : undefined
      }
    />
  );
}
