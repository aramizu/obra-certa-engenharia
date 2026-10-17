import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Construction Visual Panel - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:flex relative bg-stone-900 overflow-hidden">
        <Image
          src="/images/construction-bg.jpg"
          alt="Construção civil"
          fill
          className="object-cover opacity-40"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900/60 via-stone-800/40 to-transparent" />
        
        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-stone-400" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <h1 className="text-4xl font-display uppercase tracking-wider mb-4">
              Obra Certa Engenharia
            </h1>
            <div className="w-16 h-1 bg-accent" />
          </div>
          
          <div className="space-y-4 max-w-md">
            <p className="text-lg font-medium">
              Gestão profissional de obras e orçamentos
            </p>
            <p className="text-sm text-stone-300">
              Controle financeiro completo para pessoa física gerenciar sua construção
            </p>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-12 bg-background relative">
        {/* Mobile: Top accent bar - made more prominent */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-2 bg-accent" />
        
        <div className="w-full max-w-md">
          {/* Mobile: Compact header */}
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-display text-2xl mb-2">
              Obra Certa Engenharia
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestão profissional de obras
            </p>
          </div>

          <Card>
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
    </div>
  );
}
