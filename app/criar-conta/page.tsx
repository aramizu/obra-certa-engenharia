import Link from "next/link";
import Image from "next/image";
import { SignupForm } from "./signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
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
            <pattern id="grid-fullscreen-signup" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-stone-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-fullscreen-signup)" />
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
            <CardTitle className="font-display text-2xl uppercase tracking-wide">Criar Conta</CardTitle>
            <CardDescription>
              Comece a gerenciar suas obras de forma profissional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  href="/entrar"
                  className="font-medium text-foreground hover:text-accent transition-colors"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
