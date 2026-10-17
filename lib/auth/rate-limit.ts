import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";
import { eq, and, gt, lt, sql } from "drizzle-orm";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora

const MAX_SIGNUP_ATTEMPTS = 3;
const SIGNUP_LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hora

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  lockedUntil?: Date;
  retryAfter?: number; // segundos
}

/**
 * Verifica se uma ação está limitada por rate limiting
 */
export async function checkRateLimit(
  identifier: string,
  action: "login" | "signup"
): Promise<RateLimitResult> {
  const now = new Date();
  const maxAttempts = action === "login" ? MAX_LOGIN_ATTEMPTS : MAX_SIGNUP_ATTEMPTS;
  const lockoutDuration = action === "login" ? LOCKOUT_DURATION_MS : SIGNUP_LOCKOUT_DURATION_MS;

  // Buscar registro de rate limit
  const existingRecords = await db
    .select()
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.identifier, identifier),
        eq(rateLimits.action, action)
      )
    )
    .limit(1);

  const existing = existingRecords[0];

  // Se não existe registro, permitir
  if (!existing) {
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Se está bloqueado, verificar se ainda está no período de bloqueio
  if (existing.lockedUntil && existing.lockedUntil > now) {
    const retryAfter = Math.ceil((existing.lockedUntil.getTime() - now.getTime()) / 1000);
    return {
      allowed: false,
      lockedUntil: existing.lockedUntil,
      retryAfter,
    };
  }

  // Se passou o período de bloqueio ou a janela de tempo, resetar
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  if (existing.lockedUntil && existing.lockedUntil <= now) {
    // Reset após bloqueio
    await db
      .update(rateLimits)
      .set({
        attempts: 0,
        lastAttempt: now,
        lockedUntil: null,
      })
      .where(eq(rateLimits.id, existing.id));

    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  if (existing.lastAttempt < windowStart) {
    // Reset após janela de tempo
    await db
      .update(rateLimits)
      .set({
        attempts: 0,
        lastAttempt: now,
      })
      .where(eq(rateLimits.id, existing.id));

    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Verificar se excedeu limite
  if (existing.attempts >= maxAttempts) {
    const lockedUntil = new Date(now.getTime() + lockoutDuration);
    await db
      .update(rateLimits)
      .set({
        lockedUntil,
        lastAttempt: now,
      })
      .where(eq(rateLimits.id, existing.id));

    const retryAfter = Math.ceil(lockoutDuration / 1000);
    return {
      allowed: false,
      lockedUntil,
      retryAfter,
    };
  }

  // Ainda dentro do limite
  const remainingAttempts = maxAttempts - existing.attempts - 1;
  return { allowed: true, remainingAttempts };
}

/**
 * Registra uma tentativa de ação
 */
export async function recordAttempt(
  identifier: string,
  action: "login" | "signup"
): Promise<void> {
  const now = new Date();

  const existingRecords = await db
    .select()
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.identifier, identifier),
        eq(rateLimits.action, action)
      )
    )
    .limit(1);

  if (existingRecords.length === 0) {
    // Criar novo registro
    await db.insert(rateLimits).values({
      identifier,
      action,
      attempts: 1,
      lastAttempt: now,
    });
  } else {
    // Incrementar tentativas
    await db
      .update(rateLimits)
      .set({
        attempts: sql`${rateLimits.attempts} + 1`,
        lastAttempt: now,
      })
      .where(eq(rateLimits.id, existingRecords[0].id));
  }
}

/**
 * Reseta o rate limit para um identificador/ação (após sucesso)
 */
export async function resetRateLimit(
  identifier: string,
  action: "login" | "signup"
): Promise<void> {
  await db
    .delete(rateLimits)
    .where(
      and(
        eq(rateLimits.identifier, identifier),
        eq(rateLimits.action, action)
      )
    );
}

/**
 * Limpa registros antigos de rate limit (deve ser executado periodicamente)
 */
export async function cleanupOldRateLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas
  await db
    .delete(rateLimits)
    .where(
      and(
        lt(rateLimits.lastAttempt, cutoff),
        sql`${rateLimits.lockedUntil} IS NULL OR ${rateLimits.lockedUntil} < ${cutoff}`
      )
    );
}
