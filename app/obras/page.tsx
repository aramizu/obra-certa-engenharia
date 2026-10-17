import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProjectsList } from "./projects-list";
import { CreateProjectButton } from "./create-project-button";

export default async function ObrasPage() {
  const user = await validateSession();

  if (!user) {
    redirect("/entrar");
  }

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt));

  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar userName={user.name} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader 
          title="Obras"
          description="Gerencie seus projetos e orçamentos"
        />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {userProjects.length} {userProjects.length === 1 ? "obra" : "obras"}
                </h2>
              </div>
              <CreateProjectButton />
            </div>

            <ProjectsList projects={userProjects} />
          </div>
        </main>
      </div>
    </div>
  );
}
