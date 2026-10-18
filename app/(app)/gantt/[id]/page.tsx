import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, taskColumns, taskDependencies, tasks } from "@/lib/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { GanttChart, type GanttTask } from "./gantt-chart";
import { ArchivedObraBanner } from "@/components/archived-obra-banner";
import { isProjectArchived } from "@/lib/project-archive";
import { getCachedUserProjects } from "@/lib/cached-queries";

export default async function GanttProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) redirect("/gantt?aviso=obra-inexistente");
  const archived = isProjectArchived(project);
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
    .where(and(eq(tasks.userId, user.id), eq(tasks.projectId, project.id)))
    .orderBy(asc(tasks.startDate), asc(tasks.dueDate), tasks.title);

  const projectTasks: GanttTask[] = rows.map((row) => ({
    ...row.task,
    columnName: row.columnName,
    projectName: row.projectName,
  }));

  const taskIds = projectTasks.map((task) => task.id);
  const dependencies = taskIds.length
    ? await db.select().from(taskDependencies).where(inArray(taskDependencies.taskId, taskIds))
    : [];

  return (
    <>
      <PageTitle
        title={`Gantt - ${project.name}`}
        description="Linha do tempo e dependências desta obra"
      />
      <main className="flex-1 overflow-hidden p-4 lg:p-6 space-y-4">
        {archived && <ArchivedObraBanner projectId={project.id} />}
        <div {...(archived ? { inert: true } : {})} className="h-full min-h-0">
          <GanttChart
            defaultProjectId={project.id}
            projects={userProjects}
            projectStart={project.startDate}
            projectEnd={project.targetEndDate}
            initialTasks={projectTasks}
            initialDependencies={dependencies}
          />
        </div>
      </main>
    </>
  );
}
