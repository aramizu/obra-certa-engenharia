import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { getCachedUserProjects, getCachedUserStock } from "@/lib/cached-queries";
import { EstoqueView } from "./estoque-view";

export default async function EstoquePage() {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const [items, projects] = await Promise.all([
    getCachedUserStock(user.id),
    getCachedUserProjects(user.id),
  ]);

  return (
    <>
      <PageTitle title="Estoque" description="Materiais comprados das obras ativas" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
        <EstoqueView items={items} projects={projects} />
      </main>
    </>
  );
}
