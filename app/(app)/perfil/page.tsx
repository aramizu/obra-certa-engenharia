import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { PageTitle } from "@/components/page-header";
import { PerfilForm } from "./perfil-form";

export default async function PerfilPage() {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  return (
    <>
      <PageTitle title="Perfil" description="Nome e foto da conta" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
        <PerfilForm name={user.name} email={user.email} avatarVersion={user.avatarVersion} />
      </main>
    </>
  );
}
