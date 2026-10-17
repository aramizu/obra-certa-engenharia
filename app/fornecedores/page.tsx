import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SuppliersList } from "./suppliers-list";
import { CreateSupplierButton } from "./create-supplier-button";

export default async function SuppliersPage() {
  const user = await validateSession();

  if (!user) {
    redirect("/entrar");
  }

  const userSuppliers = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.userId, user.id))
    .orderBy(desc(suppliers.createdAt));

  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar userName={user.name} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader 
          title="Fornecedores"
          description="Gerencie seus fornecedores e materiais"
        />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {userSuppliers.length} {userSuppliers.length === 1 ? "fornecedor" : "fornecedores"}
                </h2>
              </div>
              <CreateSupplierButton />
            </div>

            <SuppliersList suppliers={userSuppliers} />
          </div>
        </main>
      </div>
    </div>
  );
}
