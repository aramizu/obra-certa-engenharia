import { NextResponse } from "next/server";
import { validateSession, type SessionUser } from "@/lib/auth/session";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;]/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function userIsAdmin(user: { email: string; isAdmin?: boolean | null }): boolean {
  if (user.isAdmin) return true;
  return adminEmails().includes(user.email.toLowerCase());
}

export async function requireAdmin(): Promise<
  { user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }
> {
  const user = await validateSession();
  if (!user) {
    return { error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  }
  if (!user.isAdmin) {
    return { error: NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 }) };
  }
  return { user };
}
