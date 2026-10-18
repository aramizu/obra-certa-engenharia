"use client";

import { useCallback, useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { PageHeaderProvider, usePageHeader } from "./page-header";

interface AppLayoutProps {
  userName: string;
  isAdmin?: boolean;
  avatarVersion?: string | null;
  children: React.ReactNode;
}

function AppShell({ userName, isAdmin = false, avatarVersion = null, children }: AppLayoutProps) {
  const { header } = usePageHeader();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <div className="flex h-screen bg-graphite">
      <AppSidebar userName={userName} isAdmin={isAdmin} avatarVersion={avatarVersion} variant="desktop" />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background">
        <AppHeader
          title={header.title}
          description={header.description}
          onMenuToggle={() => setIsSidebarOpen((open) => !open)}
          isMenuOpen={isSidebarOpen}
        />

        <div className="relative flex-1 flex flex-col overflow-hidden min-h-0 ds-blueprint-grid">
          <AppSidebar
            userName={userName}
            isAdmin={isAdmin}
            avatarVersion={avatarVersion}
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

export function AppLayout({ userName, isAdmin = false, avatarVersion = null, children }: AppLayoutProps) {
  return (
    <PageHeaderProvider>
      <AppShell userName={userName} isAdmin={isAdmin} avatarVersion={avatarVersion}>{children}</AppShell>
    </PageHeaderProvider>
  );
}
