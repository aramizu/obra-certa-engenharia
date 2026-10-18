import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, taskColumns, taskDependencies, tasks } from "@/lib/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { getCachedUserProjects } from "@/lib/cached-queries";
import { MissingEntityBanner } from "@/components/missing-entity-banner";
import { StaleSelectionCleaner } from "@/components/stale-selection-cleaner";
import { visibleUserTasksWhere } from "@/lib/user-tasks";
import { GanttChart, type GanttTask } from "./[id]/gantt-chart";

export default async function GanttIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const { aviso } = await searchParams;
  const userProjects = await getCachedUserProjects(user.id);

  const rows = await db
    .select({
      task: tasks,
      columnName: taskColumns.name,
      projectName: projects.name,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(taskColumns, eq(tasks.statusColumnId, taskColumns.id))
    .where(visibleUserTasksWhere(user.id))
    .orderBy(asc(tasks.startDate), asc(tasks.dueDate), tasks.title);

  const chartTasks: GanttTask[] = rows.map((row) => ({
    ...row.task,
    columnName: row.columnName,
    projectName: row.projectName,
  }));

  const taskIds = chartTasks.map((task) => task.id);
  const dependencies = taskIds.length
    ? await db.select().from(taskDependencies).where(inArray(taskDependencies.taskId, taskIds))
    : [];

  return (
    <>
      <PageTitle title="Gantt" description="Cronograma de todas as tarefas, com ou sem obra" />
      <main className="flex-1 overflow-hidden p-4 lg:p-6 space-y-4">
        <StaleSelectionCleaner validProjectIds={userProjects.map((project) => project.id)} />
        <MissingEntityBanner aviso={aviso} />
        <GanttChart
          projects={userProjects}
          groupByProject
          initialTasks={chartTasks}
          initialDependencies={dependencies}
        />
      </main>
    </>
  );
}
