import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Gera um token CSRF criptograficamente seguro
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Define o cookie CSRF
 */
export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

/**
 * Obtém o token CSRF do cookie
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Valida o token CSRF do header contra o cookie
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  // Apenas validar para métodos que modificam estado
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = await getCsrfToken();

  if (!headerToken || !cookieToken) {
    return false;
  }

  // Comparação timing-safe
  return timingSafeEqual(headerToken, cookieToken);
}

/**
 * Comparação de strings resistente a timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Gera e configura um novo token CSRF
 */
export async function refreshCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  await setCsrfCookie(token);
  return token;
}
