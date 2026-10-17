import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const user = await validateSession();

  if (!user) {
    redirect("/entrar");
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader userName={user.name} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-heading mb-2">
              Olá, {firstName}
            </h2>
            <p className="text-muted-foreground">
              Bem-vindo à sua central de gestão de obras e orçamentos
            </p>
          </div>

          {/* Placeholder Cards - Foundation for Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Obras Ativas</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  —
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Projetos em andamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Orçamento Total</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  —
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Valor total planejado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Custos Executados</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  —
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Gastos até o momento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area - Ready for Charts and Tables */}
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral Financeira</CardTitle>
              <CardDescription>
                Acompanhamento de custos e orçamento das obras
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-md">
              <p className="text-sm text-muted-foreground">
                Área reservada para gráficos e análises financeiras
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
