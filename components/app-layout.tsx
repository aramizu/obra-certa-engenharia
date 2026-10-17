"use client";

import { useCallback, useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { PageHeaderProvider, usePageHeader } from "./page-header";

interface AppLayoutProps {
  userName: string;
  children: React.ReactNode;
}

function AppShell({ userName, children }: AppLayoutProps) {
  const { header } = usePageHeader();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar userName={userName} variant="desktop" />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader
          title={header.title}
          description={header.description}
          onMenuToggle={() => setIsSidebarOpen((open) => !open)}
          isMenuOpen={isSidebarOpen}
        />

        <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
          <AppSidebar
            userName={userName}
            variant="mobile"
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
          />
          {children}
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ userName, children }: AppLayoutProps) {
  return (
    <PageHeaderProvider>
      <AppShell userName={userName}>{children}</AppShell>
    </PageHeaderProvider>
  );
}
