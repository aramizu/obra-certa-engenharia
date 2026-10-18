import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { getCachedKnowledgeCatalog } from "@/lib/cached-queries";
import { AdminBaseView } from "./admin-base-view";

export default async function AdminBasePage() {
  const user = await validateSession();
  if (!user) redirect("/entrar");
  if (!user.isAdmin) redirect("/");

  const catalog = await getCachedKnowledgeCatalog();

  return (
    <>
      <PageTitle title="Base SINAPI" description="Materiais, consumos, perda e categorias de fornecedor" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <AdminBaseView initialCatalog={catalog} />
        </div>
      </main>
    </>
  );
}
