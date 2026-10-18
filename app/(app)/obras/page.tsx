import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProjectsList } from "./projects-list";
import { ArchivedProjectsSection } from "./archived-projects-section";
import { CreateProjectButton } from "./create-project-button";
import { MissingEntityBanner } from "@/components/missing-entity-banner";
import { StaleSelectionCleaner } from "@/components/stale-selection-cleaner";
import { isProjectArchived } from "@/lib/project-archive";

export default async function ObrasPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const user = await validateSession();

  if (!user) {
    redirect("/entrar");
  }

  const { aviso } = await searchParams;

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt));

  const activeProjects = userProjects.filter((project) => !isProjectArchived(project));
  const archivedProjects = userProjects.filter((project) => isProjectArchived(project));

  return (
    <>
      <PageTitle title="Obras" description="Gerencie seus projetos e orçamentos" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <StaleSelectionCleaner validProjectIds={activeProjects.map((project) => project.id)} />
          <MissingEntityBanner aviso={aviso} />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {activeProjects.length} {activeProjects.length === 1 ? "obra" : "obras"}
              </h2>
            </div>
            <CreateProjectButton />
          </div>

          <ProjectsList projects={activeProjects} />
          <ArchivedProjectsSection projects={archivedProjects} />
        </div>
      </main>
    </>
  );
}
