import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, normalizeEmail } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, recordAttempt, resetRateLimit } from "@/lib/auth/rate-limit";
import { z } from "zod";

// Hash bcrypt (custo 12) de um valor aleatório descartável, usado só para timing
const DUMMY_PASSWORD_HASH =
  "$2a$12$ch91XLcYXe5r07cEzL04BuiYePg7DDTuMI085nELoKDb.Q/NIus5e";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const emailNormalized = normalizeEmail(email);

    // Obter IP para rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "unknown";

    // Verificar rate limit por IP
    const rateLimitCheck = await checkRateLimit(ip, "login");
    if (!rateLimitCheck.allowed) {
      const minutes = Math.ceil((rateLimitCheck.retryAfter || 0) / 60);
      return NextResponse.json(
        {
          error: `Muitas tentativas de login. Tente novamente em ${minutes} minutos.`,
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      );
    }

    // Buscar usuário
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.emailNormalized, emailNormalized))
      .limit(1);

    const user = userRecords[0];

    // Verificar se usuário existe e senha está correta
    // Usar mesma mensagem genérica para ambos os casos (evitar enumeração)
    // Sempre executar bcrypt (hash fictício se usuário não existe) para
    // manter tempo de resposta constante e evitar enumeração por timing
    const passwordOk = await verifyPassword(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH
    );
    if (!user || !passwordOk) {
      // Registrar tentativa falhada
      await recordAttempt(ip, "login");

      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    // Verificar se conta está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      return NextResponse.json(
        { error: `Conta temporariamente bloqueada. Tente novamente em ${minutes} minutos.` },
        { status: 423 }
      );
    }

    // Resetar contador de falhas do usuário se estava bloqueado
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await db
        .update(users)
        .set({
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Resetar rate limit após login bem-sucedido
    await resetRateLimit(ip, "login");

    // Criar sessão
    const userAgent = request.headers.get("user-agent");
    const sessionToken = await createSession(user.id, userAgent, ip);
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro ao processar login" },
      { status: 500 }
    );
  }
}
