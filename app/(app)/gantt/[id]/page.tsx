import { validateSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, taskColumns, taskDependencies, tasks } from "@/lib/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { GanttChart, type GanttTask } from "./gantt-chart";

export default async function GanttProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) notFound();

  const rows = await db
    .select({
      task: tasks,
      columnName: taskColumns.name,
    })
    .from(tasks)
    .leftJoin(taskColumns, eq(tasks.statusColumnId, taskColumns.id))
    .where(eq(tasks.projectId, project.id))
    .orderBy(asc(tasks.startDate), asc(tasks.dueDate), tasks.title);

  const projectTasks: GanttTask[] = rows.map((row) => ({
    ...row.task,
    columnName: row.columnName,
  }));

  const taskIds = projectTasks.map((task) => task.id);
  const dependencies = taskIds.length
    ? await db.select().from(taskDependencies).where(inArray(taskDependencies.taskId, taskIds))
    : [];

  return (
    <>
      <PageTitle
        title={`Gantt - ${project.name}`}
        description="Linha do tempo, dependências e marcos da obra"
      />
      <main className="flex-1 overflow-hidden p-4 lg:p-6">
        <GanttChart
          projectId={project.id}
          projectStart={project.startDate}
          projectEnd={project.targetEndDate}
          initialTasks={projectTasks}
          initialDependencies={dependencies}
        />
      </main>
    </>
  );
}
