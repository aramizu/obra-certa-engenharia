import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCachedUserProjects } from "@/lib/cached-queries";
import { getOwnedProject } from "@/lib/owned-project";
import { isProjectArchived } from "@/lib/project-archive";
import { ArchivedObraBanner } from "@/components/archived-obra-banner";
import { MissingEntityBanner } from "@/components/missing-entity-banner";
import { StaleSelectionCleaner } from "@/components/stale-selection-cleaner";
import {
  ensureUserKanbanColumns,
  parseObraFilter,
  tasksWhereForObraFilter,
  OBRA_FILTER_ALL,
  OBRA_FILTER_NONE,
} from "@/lib/user-tasks";
import { KanbanBoard } from "./[id]/kanban-board";
import { ObraFilterBar } from "@/components/obra-filter-bar";

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; obra?: string }>;
}) {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const { aviso, obra } = await searchParams;
  const filter = parseObraFilter(obra);
  const userProjects = await getCachedUserProjects(user.id);
  const columns = await ensureUserKanbanColumns(user.id);

  let archivedProjectId: string | null = null;
  if (filter !== OBRA_FILTER_ALL && filter !== OBRA_FILTER_NONE) {
    const project = await getOwnedProject(filter, user.id);
    if (!project) redirect("/kanban?aviso=obra-inexistente");
    if (isProjectArchived(project)) archivedProjectId = project.id;
  }

  const rows = await db
    .select({
      task: tasks,
      projectName: projects.name,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(tasksWhereForObraFilter(user.id, filter))
    .orderBy(tasks.orderInColumn);

  const boardTasks = rows.map((row) => ({
    ...row.task,
    projectName: row.projectName,
  }));

  const defaultProjectId = filter !== OBRA_FILTER_ALL && filter !== OBRA_FILTER_NONE ? filter : null;
  const locked = Boolean(archivedProjectId);

  return (
    <>
      <PageTitle title="Kanban" description="Quadro único de todas as tarefas, com ou sem obra" />
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:p-6">
        <div className="shrink-0 space-y-4">
          <StaleSelectionCleaner validProjectIds={userProjects.map((project) => project.id)} />
          <MissingEntityBanner aviso={aviso} />
          {archivedProjectId && <ArchivedObraBanner projectId={archivedProjectId} />}
          <ObraFilterBar projects={userProjects} value={filter} basePath="/kanban" />
        </div>
        <div
          {...(locked ? { inert: true } : {})}
          className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden"
        >
          <KanbanBoard
            projects={userProjects}
            defaultProjectId={defaultProjectId}
            initialColumns={columns}
            initialTasks={boardTasks}
          />
        </div>
      </main>
    </>
  );
}
