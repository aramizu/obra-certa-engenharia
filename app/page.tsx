import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { projects, budgetCategories, materials } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

async function getBudgetSummary(userId: string) {
  const activeProjects = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.userId, userId));

  const totalBudget = await db
    .select({ total: sql<string>`COALESCE(SUM(${projects.totalBudget}), 0)` })
    .from(projects)
    .where(eq(projects.userId, userId));

  const totalSpent = await db
    .select({ 
      total: sql<string>`COALESCE(SUM(${materials.totalPrice}), 0)` 
    })
    .from(materials)
    .innerJoin(projects, eq(materials.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(materials.status, "purchased")
      )
    );

  const categorySummary = await db
    .select({
      categoryName: budgetCategories.name,
      budgeted: budgetCategories.budgetedAmount,
      spent: sql<string>`COALESCE(SUM(CASE WHEN ${materials.status} = 'purchased' THEN ${materials.totalPrice} ELSE 0 END), 0)`,
    })
    .from(budgetCategories)
    .leftJoin(materials, eq(budgetCategories.id, materials.budgetCategoryId))
    .innerJoin(projects, eq(budgetCategories.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .groupBy(budgetCategories.id, budgetCategories.name, budgetCategories.budgetedAmount, budgetCategories.order)
    .orderBy(budgetCategories.order);

  return {
    activeProjectsCount: Number(activeProjects[0]?.count || 0),
    totalBudget: parseFloat(totalBudget[0]?.total || "0"),
    totalSpent: parseFloat(totalSpent[0]?.total || "0"),
    categorySummary,
  };
}

export default async function HomePage() {
  const user = await validateSession();

  if (!user) {
    redirect("/entrar");
  }

  const firstName = user.name.split(" ")[0];
  const summary = await getBudgetSummary(user.id);
  const budgetRemaining = summary.totalBudget - summary.totalSpent;
  const budgetPercentage = summary.totalBudget > 0 
    ? (summary.totalSpent / summary.totalBudget) * 100 
    : 0;

  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar userName={user.name} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader 
          title={`Olá, ${firstName}`}
          description="Bem-vindo à sua central de gestão de obras e orçamentos"
        />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Obras Ativas</CardDescription>
                  <CardTitle className="text-4xl font-data tabular-nums">
                    {summary.activeProjectsCount}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {summary.activeProjectsCount === 1 ? "Projeto em andamento" : "Projetos em andamento"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Orçamento Total</CardDescription>
                  <CardTitle className="text-4xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(summary.totalBudget)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Valor total planejado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Executado</CardDescription>
                  <CardTitle className="text-4xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(summary.totalSpent)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all"
                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-data tabular-nums text-muted-foreground">
                      {budgetPercentage.toFixed(0)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {summary.categorySummary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Orçamento por Categoria</CardTitle>
                  <CardDescription>
                    Acompanhamento detalhado de gastos por etapa da obra
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.categorySummary.map((cat) => {
                      const budgeted = parseFloat(cat.budgeted);
                      const spent = parseFloat(cat.spent);
                      const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
                      const remaining = budgeted - spent;

                      return (
                        <div key={cat.categoryName} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{cat.categoryName}</span>
                            <div className="flex items-center gap-4 font-data tabular-nums text-sm">
                              <span className="text-muted-foreground">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(spent)}
                              </span>
                              <span className="text-foreground">
                                / {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(budgeted)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  percentage > 100 ? "bg-destructive" : "bg-accent"
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-data tabular-nums ${
                              remaining < 0 ? "text-destructive" : "text-muted-foreground"
                            }`}>
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {summary.activeProjectsCount === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-lg text-muted-foreground mb-4">
                    Nenhuma obra cadastrada ainda
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Comece criando sua primeira obra na seção <strong>Obras</strong>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
