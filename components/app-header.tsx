import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  userName: string;
}

export function AppHeader({ userName }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-title text-base">Minha Engenharia</h1>
            <div className="h-0.5 w-8 bg-accent mt-1" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {userName}
            </span>
          </div>
          
          <form action="/api/auth/sair" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
