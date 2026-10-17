import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/entrar", "/criar-conta"];
const authPaths = ["/entrar", "/criar-conta"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Adicionar headers de segurança
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  const pathname = request.nextUrl.pathname;

  // Ignorar arquivos estáticos e API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // Verificar se o usuário está autenticado via cookie
  const sessionToken = request.cookies.get("session_token");
  const isAuthenticated = !!sessionToken;

  // Se está em página de auth e já autenticado, redirecionar para home
  if (authPaths.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Se não está em página pública e não está autenticado, redirecionar para login
  if (!publicPaths.includes(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/entrar", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
