import { validateSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { db } from "@/lib/db";
import { projects, taskDependencies, tasks } from "@/lib/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { GanttChart } from "./gantt-chart";

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

  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, project.id))
    .orderBy(asc(tasks.startDate), asc(tasks.dueDate), tasks.title);

  const taskIds = projectTasks.map((task) => task.id);
  const dependencies = taskIds.length
    ? await db.select().from(taskDependencies).where(inArray(taskDependencies.taskId, taskIds))
    : [];

  return (
    <AppLayout
      userName={user.name}
      title={`Gantt - ${project.name}`}
      description="Linha do tempo, dependências e marcos da obra"
    >
      <main className="flex-1 overflow-hidden p-4 lg:p-6">
        <GanttChart
          projectId={project.id}
          projectStart={project.startDate}
          projectEnd={project.targetEndDate}
          initialTasks={projectTasks}
          initialDependencies={dependencies}
        />
      </main>
    </AppLayout>
  );
}
