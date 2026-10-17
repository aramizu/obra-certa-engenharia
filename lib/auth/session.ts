import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Gera um token de sessão criptograficamente seguro
 */
function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Cria uma nova sessão para o usuário
 */
export async function createSession(
  userId: string,
  userAgent?: string | null,
  ipAddress?: string | null
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
    userAgent: userAgent || null,
    ipAddress: ipAddress || null,
  });

  return token;
}

/**
 * Define o cookie de sessão com flags de segurança
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Remove o cookie de sessão
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Valida a sessão e retorna o usuário se válida
 */
export async function validateSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const result = await db
    .select({
      user: users,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { user, session } = result[0];

  // Rotação de sessão: renovar se estiver na metade final do período
  const halfDuration = SESSION_DURATION_MS / 2;
  const timeUntilExpiry = session.expiresAt.getTime() - Date.now();

  if (timeUntilExpiry < halfDuration) {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await db
      .update(sessions)
      .set({ expiresAt: newExpiresAt, updatedAt: new Date() })
      .where(eq(sessions.id, session.id));

    // Atualizar cookie com nova expiração. Em Server Components o Next.js
    // não permite alterar cookies; nesse caso a renovação do cookie ocorre
    // no próximo Route Handler / Server Action.
    try {
      await setSessionCookie(token);
    } catch {
      // ignorado: contexto somente leitura (Server Component)
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  };
}

/**
 * Invalida a sessão atual
 */
export async function invalidateSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  await deleteSessionCookie();
}

/**
 * Remove todas as sessões de um usuário
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Limpa sessões expiradas (deve ser executado periodicamente)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(
    lt(sessions.expiresAt, new Date())
  );
}
