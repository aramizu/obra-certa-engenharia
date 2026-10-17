"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export type PageHeaderState = {
  title: string;
  description?: string;
};

const PageHeaderContext = createContext<{
  header: PageHeaderState;
  setHeader: (header: PageHeaderState) => void;
} | null>(null);

export function titleFromPath(pathname: string): PageHeaderState {
  if (pathname === "/") {
    return { title: "Painel", description: "Painel de orçamento, pendências e compras da obra" };
  }
  if (pathname.startsWith("/obras")) {
    return { title: "Obras", description: "Gerencie seus projetos e orçamentos" };
  }
  if (pathname.startsWith("/fornecedores")) {
    return { title: "Fornecedores", description: "Gerencie seus fornecedores e materiais" };
  }
  if (pathname.startsWith("/kanban")) {
    return { title: "Kanban", description: "Gerencie tarefas por obra estilo Trello" };
  }
  if (pathname.startsWith("/gantt")) {
    return { title: "Gantt", description: "Planeje o tempo das tarefas por obra" };
  }
  if (pathname.startsWith("/calendario")) {
    return { title: "Calendário", description: "Agenda mensal e semanal das tarefas com data" };
  }
  if (pathname.startsWith("/design-system")) {
    return { title: "Sistema gráfico", description: "Identidade Obra Certa — prancha de componentes" };
  }
  return { title: "Obra Certa" };
}

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const fallback = useMemo(() => titleFromPath(pathname), [pathname]);
  const [path, setPath] = useState(pathname);
  const [override, setOverride] = useState<PageHeaderState | null>(null);

  if (path !== pathname) {
    setPath(pathname);
    setOverride(null);
  }

  const setHeader = useCallback((header: PageHeaderState) => {
    setOverride(header);
  }, []);

  return (
    <PageHeaderContext.Provider value={{ header: override ?? fallback, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  }
  return context;
}

export function PageTitle({ title, description }: PageHeaderState) {
  const { setHeader } = usePageHeader();

  useLayoutEffect(() => {
    setHeader({ title, description });
  }, [title, description, setHeader]);

  return null;
}
