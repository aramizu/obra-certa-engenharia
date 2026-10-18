import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { getCachedUserProjectBoards } from "@/lib/cached-queries";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ds";
import { KanbanSquare } from "lucide-react";
import { MissingEntityBanner } from "@/components/missing-entity-banner";
import { StaleSelectionCleaner } from "@/components/stale-selection-cleaner";

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const user = await validateSession();

  if (!user) {
    redirect("/entrar");
  }

  const { aviso } = await searchParams;

  const userProjects = await getCachedUserProjectBoards(user.id);

  return (
    <>
      <PageTitle title="Kanban" description="Gerencie tarefas por obra estilo Trello" />
      <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <StaleSelectionCleaner validProjectIds={userProjects.map((project) => project.id)} />
            <MissingEntityBanner aviso={aviso} />
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Selecione uma obra
              </h2>
              <p className="text-sm text-muted-foreground">
                Escolha a obra para visualizar e gerenciar as tarefas
              </p>
            </div>

            {userProjects.length === 0 ? (
              <Card>
                <EmptyState
                  illustration="plan"
                  title="Nenhuma obra no Kanban"
                  description="Crie uma obra na seção Obras para usar o quadro de tarefas."
                />
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userProjects.map((project) => (
                  <Link key={project.id} href={`/kanban/${project.id}`} prefetch>
                    <Card className="h-full bg-white hover:border-accent transition-colors cursor-pointer">
                      <CardHeader className="flex flex-row items-start justify-between space-y-0">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">{project.name}</CardTitle>
                          {project.address && (
                            <CardDescription className="text-xs">
                              {project.address}
                            </CardDescription>
                          )}
                        </div>
                        <KanbanSquare className="h-5 w-5 text-accent" />
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
