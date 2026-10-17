import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { suppliers, materials, projects, budgetCategories } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SupplierActions } from "./supplier-actions";
import { MaterialsList } from "./materials-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateMaterialButton } from "./create-material-button";
import { Phone, Mail, User } from "lucide-react";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) {
    redirect("/entrar");
  }

  const { id } = await params;

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.userId, user.id)))
    .limit(1);

  if (!supplier) {
    redirect("/fornecedores?aviso=fornecedor-inexistente");
  }

  const supplierMaterials = await db
    .select({
      id: materials.id,
      projectId: materials.projectId,
      budgetCategoryId: materials.budgetCategoryId,
      name: materials.name,
      brand: materials.brand,
      unit: materials.unit,
      quantityPerUnit: materials.quantityPerUnit,
      quantity: materials.quantity,
      unitPrice: materials.unitPrice,
      totalPrice: materials.totalPrice,
      status: materials.status,
      purchaseDate: materials.purchaseDate,
      notes: materials.notes,
      createdAt: materials.createdAt,
      projectName: projects.name,
      categoryName: budgetCategories.name,
    })
    .from(materials)
    .innerJoin(projects, eq(materials.projectId, projects.id))
    .leftJoin(budgetCategories, eq(materials.budgetCategoryId, budgetCategories.id))
    .where(and(eq(materials.supplierId, supplier.id), eq(projects.userId, user.id)))
    .orderBy(sql`${materials.createdAt} DESC`);

  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.userId, user.id));

  const totalQuoted = supplierMaterials
    .filter(m => m.status === "quoted")
    .reduce((sum, m) => sum + parseFloat(m.totalPrice), 0);

  const totalPurchased = supplierMaterials
    .filter(m => m.status === "purchased")
    .reduce((sum, m) => sum + parseFloat(m.totalPrice), 0);

  return (
    <>
      <PageTitle title={supplier.name} description="Materiais e cotações" />
      <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                {supplier.contact && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{supplier.contact}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.notes && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                    {supplier.notes}
                  </p>
                )}
              </div>
              <SupplierActions supplier={supplier} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Total Cotado</CardDescription>
                  <CardTitle className="text-3xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalQuoted)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {supplierMaterials.filter(m => m.status === "quoted").length} itens cotados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Total Comprado</CardDescription>
                  <CardTitle className="text-3xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalPurchased)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {supplierMaterials.filter(m => m.status === "purchased").length} itens comprados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="font-data">Total Geral</CardDescription>
                  <CardTitle className="text-3xl font-data tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalQuoted + totalPurchased)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {supplierMaterials.length} itens no total
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Materiais</h2>
                  <p className="text-sm text-muted-foreground">
                    Cotações e compras deste fornecedor
                  </p>
                </div>
                <CreateMaterialButton supplierId={supplier.id} projects={userProjects} />
              </div>

              <MaterialsList 
                materials={supplierMaterials} 
                supplierId={supplier.id}
                projects={userProjects}
              />
            </div>
          </div>
        </main>
    </>
  );
}
