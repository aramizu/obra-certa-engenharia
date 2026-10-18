import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, budgetCategories, materials, tasks, taskColumns } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { DashboardView, type DashboardCategory, type DashboardMaterial, type DashboardTask } from "./dashboard-view";
import { StaleSelectionCleaner } from "@/components/stale-selection-cleaner";
import { getCachedUserProjects } from "@/lib/cached-queries";

export default async function HomePage() {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const firstName = user.name.split(" ")[0];

  const userProjects = await getCachedUserProjects(user.id);

  const taskRows = await db
    .select({
      task: tasks,
      projectName: projects.name,
      columnName: taskColumns.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(taskColumns, eq(tasks.statusColumnId, taskColumns.id))
    .where(eq(projects.userId, user.id));

  const dashboardTasks: DashboardTask[] = taskRows.map((row) => ({
    ...row.task,
    projectName: row.projectName,
    columnName: row.columnName,
  }));

  const materialRows = await db
    .select({
      id: materials.id,
      name: materials.name,
      brand: materials.brand,
      totalPrice: materials.totalPrice,
      status: materials.status,
      projectId: materials.projectId,
      projectName: projects.name,
      supplierId: materials.supplierId,
    })
    .from(materials)
    .innerJoin(projects, eq(materials.projectId, projects.id))
    .where(eq(projects.userId, user.id));

  const dashboardMaterials: DashboardMaterial[] = materialRows;

  const categoryRows = await db
    .select({
      projectId: budgetCategories.projectId,
      name: budgetCategories.name,
      budgeted: budgetCategories.budgetedAmount,
      spent: sql<string>`COALESCE(SUM(CASE WHEN ${materials.status} = 'purchased' THEN ${materials.totalPrice} ELSE 0 END), 0)`,
    })
    .from(budgetCategories)
    .leftJoin(materials, eq(budgetCategories.id, materials.budgetCategoryId))
    .innerJoin(projects, eq(budgetCategories.projectId, projects.id))
    .where(eq(projects.userId, user.id))
    .groupBy(
      budgetCategories.id,
      budgetCategories.projectId,
      budgetCategories.name,
      budgetCategories.budgetedAmount,
      budgetCategories.order
    )
    .orderBy(budgetCategories.order);

  const dashboardCategories: DashboardCategory[] = categoryRows.map((row) => ({
    projectId: row.projectId,
    name: row.name,
    budgeted: parseFloat(row.budgeted || "0"),
    spent: parseFloat(row.spent || "0"),
  }));

  return (
    <>
      <PageTitle
        title={`Olá, ${firstName}`}
        description="Painel de orçamento, pendências e compras da obra"
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
        <StaleSelectionCleaner validProjectIds={userProjects.map((project) => project.id)} />
        <DashboardView
          userName={user.name}
          projects={userProjects}
          tasks={dashboardTasks}
          materials={dashboardMaterials}
          categories={dashboardCategories}
        />
      </main>
    </>
  );
}
