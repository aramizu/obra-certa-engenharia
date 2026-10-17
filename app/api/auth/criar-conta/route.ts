import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, validatePassword, normalizeEmail } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, recordAttempt, resetRateLimit } from "@/lib/auth/rate-limit";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0];
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Validar força da senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0], field: "password" },
        { status: 400 }
      );
    }

    const emailNormalized = normalizeEmail(email);

    // Obter IP para rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "unknown";

    // Verificar rate limit por IP
    const rateLimitCheck = await checkRateLimit(ip, "signup");
    if (!rateLimitCheck.allowed) {
      const minutes = Math.ceil((rateLimitCheck.retryAfter || 0) / 60);
      return NextResponse.json(
        {
          error: `Muitas tentativas de criação de conta. Tente novamente em ${minutes} minutos.`,
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      );
    }

    // Verificar se email já existe
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.emailNormalized, emailNormalized))
      .limit(1);

    if (existingUsers.length > 0) {
      // Registrar tentativa para prevenir enumeração de usuários via timing
      await recordAttempt(ip, "signup");
      
      // Mensagem genérica para evitar enumeração de usuários
      return NextResponse.json(
        { error: "Não foi possível criar a conta. Verifique os dados e tente novamente.", field: "email" },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar usuário
    const newUserRecords = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.trim(),
        emailNormalized,
        passwordHash,
      })
      .returning();

    const newUser = newUserRecords[0];

    // Resetar rate limit após criação bem-sucedida
    await resetRateLimit(ip, "signup");

    // Criar sessão
    const userAgent = request.headers.get("user-agent");
    const sessionToken = await createSession(newUser.id, userAgent, ip);
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Erro na criação de conta:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 }
    );
  }
}
