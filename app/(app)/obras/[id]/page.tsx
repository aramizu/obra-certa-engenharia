import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { projects, budgetCategories, materials, tasks, suppliers } from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { ProjectActions } from "./project-actions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ds";
import { ArchivedObraBanner } from "@/components/archived-obra-banner";
import { isProjectArchived } from "@/lib/project-archive";
import { categoryNameOnMaterialProject } from "@/lib/owned-refs";
import { isCompradoStatus, parseMoney } from "@/lib/item-status";
import { ObraItemsView, type ObraItemRow } from "./obra-items-view";

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

  const groups = await db
    .select({
      id: budgetCategories.id,
      name: budgetCategories.name,
      budgetedAmount: budgetCategories.budgetedAmount,
      order: budgetCategories.order,
    })
    .from(budgetCategories)
    .where(eq(budgetCategories.projectId, project.id))
    .orderBy(budgetCategories.order);

  const itemRows = await db
    .select({
      id: materials.id,
      name: materials.name,
      brand: materials.brand,
      unit: materials.unit,
      quantity: materials.quantity,
      unitPrice: materials.unitPrice,
      totalPrice: materials.totalPrice,
      status: materials.status,
      notes: materials.notes,
      supplierId: materials.supplierId,
      budgetCategoryId: materials.budgetCategoryId,
      kbRefId: materials.kbRefId,
      kbRefCode: materials.kbRefCode,
      refUnit: materials.refUnit,
      refUnitPrice: materials.refUnitPrice,
      groupName: budgetCategories.name,
      supplierName: suppliers.name,
    })
    .from(materials)
    .leftJoin(budgetCategories, categoryNameOnMaterialProject())
    .leftJoin(suppliers, eq(materials.supplierId, suppliers.id))
    .where(eq(materials.projectId, project.id))
    .orderBy(asc(materials.createdAt));

  const items: ObraItemRow[] = itemRows;

  const userSuppliers = await db
    .select({ id: suppliers.id, name: suppliers.name })
    .from(suppliers)
    .where(eq(suppliers.userId, user.id))
    .orderBy(asc(suppliers.name));

  const totalOrcado = items.reduce((sum, item) => sum + (parseMoney(item.totalPrice) ?? 0), 0);
  const totalComprado = items
    .filter((item) => isCompradoStatus(item.status))
    .reduce((sum, item) => sum + (parseMoney(item.totalPrice) ?? 0), 0);
  const budgetBase = parseFloat(project.totalBudget || "0") || totalOrcado;
  const spentPercentage = budgetBase > 0 ? (totalComprado / budgetBase) * 100 : 0;
  const archived = isProjectArchived(project);

  return (
    <>
      <PageTitle title={project.name} description={project.address || undefined} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {archived && <ArchivedObraBanner projectId={project.id} />}
            <div className="flex items-start justify-between gap-3">
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
              <ProjectActions
                project={project}
                taskCount={Number(taskCount?.n ?? 0)}
                materialCount={Number(materialCount?.n ?? 0)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3" {...(archived ? { inert: true } : {})}>
              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Orçamento</CardDescription>
                  <CardTitle className="text-2xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(project.totalBudget))}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Orçado nos itens</CardDescription>
                  <CardTitle className="text-2xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalOrcado)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Comprado</CardDescription>
                  <CardTitle className="text-2xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalComprado)}
                  </CardTitle>
                  <div className="flex items-center gap-2 pt-2">
                    <ProgressBar value={spentPercentage} className="flex-1" />
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                      {spentPercentage.toFixed(0)}%
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <div {...(archived ? { inert: true } : {})}>
              <ObraItemsView
                projectId={project.id}
                items={items}
                groups={groups}
                suppliers={userSuppliers}
                archived={archived}
              />
            </div>
          </div>
        </main>
    </>
  );
}
