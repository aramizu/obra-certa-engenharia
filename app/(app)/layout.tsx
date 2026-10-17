import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { AppLayout } from "@/components/app-layout";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  return <AppLayout userName={user.name}>{children}</AppLayout>;
}
