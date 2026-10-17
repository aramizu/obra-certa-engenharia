import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Fullscreen Background */}
      <Image
        src="/images/construction-bg.jpg"
        alt="Construção civil"
        fill
        className="object-cover"
        priority
        quality={90}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/85 via-stone-800/80 to-stone-900/85" />
      
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-fullscreen" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-stone-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-fullscreen)" />
        </svg>
      </div>

      {/* Centered Content */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-wider mb-3">
            Obra Certa Engenharia
          </h1>
          <div className="w-16 h-1 bg-accent mx-auto mb-4" />
          <p className="text-sm sm:text-base text-stone-200">
            Gestão profissional de obras e orçamentos
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase tracking-wide">Entrar</CardTitle>
            <CardDescription>
              Acesse sua conta para gerenciar suas obras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-64" />}>
              <LoginForm />
            </Suspense>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link
                  href="/criar-conta"
                  className="font-medium text-foreground hover:text-accent transition-colors"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
