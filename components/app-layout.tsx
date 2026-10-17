"use client";

import { useCallback, useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

interface AppLayoutProps {
  userName: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AppLayout({ userName, title, description, children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar userName={userName} variant="desktop" />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader
          title={title}
          description={description}
          onMenuToggle={() => setIsSidebarOpen((open) => !open)}
          isMenuOpen={isSidebarOpen}
        />

        <div className="relative flex-1 flex flex-col overflow-hidden">
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
