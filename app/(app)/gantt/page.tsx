import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ds";
import { GanttChart } from "lucide-react";

export default async function GanttIndexPage() {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      address: projects.address,
      taskCount: sql<number>`COUNT(DISTINCT ${tasks.id})`,
    })
    .from(projects)
    .leftJoin(tasks, eq(projects.id, tasks.projectId))
    .where(eq(projects.userId, user.id))
    .groupBy(projects.id, projects.name, projects.address, projects.createdAt)
    .orderBy(desc(projects.createdAt));

  return (
    <>
      <PageTitle title="Gantt" description="Planeje o tempo das tarefas por obra" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Selecione uma obra</h2>
            <p className="text-sm text-muted-foreground">
              Escolha a obra para ver o cronograma das mesmas tarefas do Kanban
            </p>
          </div>

          {userProjects.length === 0 ? (
            <Card>
              <EmptyState
                illustration="plan"
                title="Nenhuma obra no Gantt"
                description="Crie uma obra na seção Obras para ver o cronograma."
              />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userProjects.map((project) => (
                <Link key={project.id} href={`/gantt/${project.id}`} prefetch>
                  <Card className="h-full bg-white hover:border-accent transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{project.name}</CardTitle>
                        {project.address && (
                          <CardDescription className="text-xs">{project.address}</CardDescription>
                        )}
                      </div>
                      <GanttChart className="h-5 w-5 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {Number(project.taskCount)} {Number(project.taskCount) === 1 ? "tarefa" : "tarefas"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
