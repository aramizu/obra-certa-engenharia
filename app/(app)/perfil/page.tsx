import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { prefsFromRow } from "@/lib/push";
import { PerfilForm } from "./perfil-form";
import { NotificacoesSection } from "./notificacoes-section";

export default async function PerfilPage() {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const [row] = await db
    .select({
      notifyHour: users.notifyHour,
      notifyOnDueDay: users.notifyOnDueDay,
      notifyDayBefore: users.notifyDayBefore,
      notifyOverdue: users.notifyOverdue,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return (
    <>
      <PageTitle title="Perfil" description="Conta e notificações" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
        <div className="space-y-10">
          <PerfilForm name={user.name} email={user.email} avatarVersion={user.avatarVersion} />
          <NotificacoesSection initial={prefsFromRow(row)} />
        </div>
      </main>
    </>
  );
}
