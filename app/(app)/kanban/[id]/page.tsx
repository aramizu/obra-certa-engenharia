import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, taskColumns, tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { KanbanBoard } from "./kanban-board";
import { ArchivedObraBanner } from "@/components/archived-obra-banner";
import { isProjectArchived } from "@/lib/project-archive";

export default async function KanbanProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) {
    redirect("/entrar");
  }

  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    redirect("/kanban?aviso=obra-inexistente");
  }

  const archived = isProjectArchived(project);

  let columns = await db
    .select()
    .from(taskColumns)
    .where(eq(taskColumns.projectId, project.id))
    .orderBy(taskColumns.order);

  if (columns.length === 0 && !archived) {
    const defaultColumns = [
      { name: "A Fazer", order: 0 },
      { name: "Em Andamento", order: 1 },
      { name: "Concluído", order: 2 },
    ];

    for (const col of defaultColumns) {
      await db.insert(taskColumns).values({
        projectId: project.id,
        name: col.name,
        order: col.order,
      });
    }

    columns = await db
      .select()
      .from(taskColumns)
      .where(eq(taskColumns.projectId, project.id))
      .orderBy(taskColumns.order);
  }

  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, project.id))
    .orderBy(tasks.orderInColumn);

  return (
    <>
      <PageTitle title={`Kanban - ${project.name}`} description="Gerencie suas tarefas" />
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 lg:p-6 space-y-4">
        {archived && <ArchivedObraBanner projectId={project.id} />}
        <div {...(archived ? { inert: true } : {})} className="h-full">
          <KanbanBoard
            projectId={project.id}
            initialColumns={columns}
            initialTasks={projectTasks}
          />
        </div>
      </main>
    </>
  );
}
