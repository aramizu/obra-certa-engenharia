import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { CreateObraForm } from "./create-obra-form";

export default async function NovaObraPage() {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  return (
    <>
      <PageTitle title="Nova obra" description="Cadastro da obra e dos itens" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <CreateObraForm />
        </div>
      </main>
    </>
  );
}
