import Link from "next/link";
import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, budgetCategories, materials, tasks, projectSuggestedItems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ProjectActions } from "./project-actions";
import { BudgetCategoriesList } from "./budget-categories-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ds";
import { CreateCategoryButton } from "./create-category-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    redirect("/obras?aviso=obra-inexistente");
  }

  const [taskCount] = await db
    .select({ n: sql<number>`count(*)` })
    .from(tasks)
    .where(eq(tasks.projectId, project.id));
  const [materialCount] = await db
    .select({ n: sql<number>`count(*)` })
    .from(materials)
    .where(eq(materials.projectId, project.id));
  const [listCount] = await db
    .select({ n: sql<number>`count(*)` })
    .from(projectSuggestedItems)
    .where(eq(projectSuggestedItems.projectId, project.id));

  const categories = await db
    .select({
      id: budgetCategories.id,
      name: budgetCategories.name,
      budgetedAmount: budgetCategories.budgetedAmount,
      order: budgetCategories.order,
      spent: sql<string>`COALESCE(SUM(CASE WHEN ${materials.status} = 'purchased' THEN ${materials.totalPrice} ELSE 0 END), 0)`,
    })
    .from(budgetCategories)
    .leftJoin(materials, eq(budgetCategories.id, materials.budgetCategoryId))
    .where(eq(budgetCategories.projectId, project.id))
    .groupBy(budgetCategories.id, budgetCategories.name, budgetCategories.budgetedAmount, budgetCategories.order)
    .orderBy(budgetCategories.order);

  const totalBudgeted = categories.reduce((sum, cat) => sum + parseFloat(cat.budgetedAmount), 0);
  const totalSpent = categories.reduce((sum, cat) => sum + parseFloat(cat.spent), 0);
  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <>
      <PageTitle title={project.name} description={project.address || undefined} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                {project.startDate && project.targetEndDate && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.startDate + "T00:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                    {" → "}
                    {new Date(project.targetEndDate + "T00:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/obras/${project.id}/lista`}
                  prefetch
                  className={cn(buttonVariants({ variant: "outline" }), "whitespace-nowrap")}
                >
                  {Number(listCount?.n ?? 0) > 0 ? "Lista de materiais" : "Gerar lista de materiais"}
                </Link>
                <ProjectActions
                  project={project}
                  taskCount={Number(taskCount?.n ?? 0)}
                  materialCount={Number(materialCount?.n ?? 0)}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Orçamento Total</CardDescription>
                  <CardTitle className="text-3xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(project.totalBudget))}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Orçado por Categoria</CardDescription>
                  <CardTitle className="text-3xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalBudgeted)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Executado</CardDescription>
                  <CardTitle className="text-3xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalSpent)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={spentPercentage} className="flex-1" />
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                      {spentPercentage.toFixed(0)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Categorias do Orçamento</h2>
                  <p className="text-sm text-muted-foreground">
                    Organize o orçamento por etapas da obra
                  </p>
                </div>
                <CreateCategoryButton projectId={project.id} />
              </div>

              <BudgetCategoriesList projectId={project.id} categories={categories} />
            </div>
          </div>
        </main>
    </>
  );
}
