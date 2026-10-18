import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, taskColumns, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { activeProjectsOwnedBy } from "@/lib/project-archive";
import { CalendarView, type CalendarTask } from "./calendar-view";
import { StaleSelectionCleaner } from "@/components/stale-selection-cleaner";
import { getCachedUserProjects } from "@/lib/cached-queries";

export default async function CalendarioPage() {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const userProjects = await getCachedUserProjects(user.id);

  const rows = await db
    .select({
      task: tasks,
      projectName: projects.name,
      columnName: taskColumns.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(taskColumns, eq(tasks.statusColumnId, taskColumns.id))
    .where(activeProjectsOwnedBy(user.id));

  const calendarTasks: CalendarTask[] = rows.map((row) => ({
    ...row.task,
    projectName: row.projectName,
    columnName: row.columnName,
  }));

  return (
    <>
      <PageTitle title="Calendário" description="Agenda mensal e semanal das tarefas com data" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
        <StaleSelectionCleaner validProjectIds={userProjects.map((project) => project.id)} />
        <CalendarView
          tasks={calendarTasks}
          projects={userProjects}
          userName={user.name}
        />
      </main>
    </>
  );
}
