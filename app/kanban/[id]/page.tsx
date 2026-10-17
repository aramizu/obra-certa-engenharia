import { validateSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { projects, taskColumns, tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { KanbanBoard } from "./kanban-board";

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
    notFound();
  }

  let columns = await db
    .select()
    .from(taskColumns)
    .where(eq(taskColumns.projectId, project.id))
    .orderBy(taskColumns.order);

  if (columns.length === 0) {
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
    <div className="flex h-screen bg-muted/30">
      <AppSidebar userName={user.name} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title={`Kanban - ${project.name}`} description="Gerencie suas tarefas" />

        <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <KanbanBoard 
            projectId={project.id}
            initialColumns={columns}
            initialTasks={projectTasks}
          />
        </main>
      </div>
    </div>
  );
}
