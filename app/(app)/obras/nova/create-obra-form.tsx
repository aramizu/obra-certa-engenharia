"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CreateObraForm() {
  const router = useRouter();
  const [loading, setLoading] = useState<"skip" | "continue" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalBudget, setTotalBudget] = useState("0");
  const [workType, setWorkType] = useState<"reforma" | "na_planta">("reforma");

  const readForm = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return {
      name: String(data.get("name") || "").trim(),
      address: (data.get("address") as string) || null,
      startDate: (data.get("startDate") as string) || null,
      targetEndDate: (data.get("targetEndDate") as string) || null,
      totalBudget,
      workType,
    };
  };

  const create = async (form: HTMLFormElement, next: "skip" | "continue") => {
    setError(null);
    const payload = readForm(form);
    if (!payload.name) {
      setError("Informe o nome da obra.");
      return;
    }
    setLoading(next);
    try {
      const response = await fetch("/api/obras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao criar obra");
      if (next === "skip") router.push(`/obras/${result.project.id}`);
      else router.push(`/obras/${result.project.id}/lista`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar obra");
      setLoading(null);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void create(event.currentTarget, "continue");
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Nova obra — apartamento</CardTitle>
          <CardDescription>
            Reforma ou imóvel na planta (estrutura pronta). Você pode pular a lista e gerá-la depois.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-delay rounded-md border-2 border-delay bg-delay-wash p-3">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome da obra *</Label>
            <Input id="name" name="name" placeholder="Ex: Apto 1204 — reforma" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" placeholder="Rua, número, bairro, cidade" />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-label">Tipo</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`rounded-lg border-2 p-4 cursor-pointer ${workType === "reforma" ? "border-primary bg-primary/5" : "border-graphite bg-white"}`}>
                <input
                  type="radio"
                  name="workType"
                  className="sr-only"
                  checked={workType === "reforma"}
                  onChange={() => setWorkType("reforma")}
                />
                <p className="font-display uppercase tracking-wider text-sm">Reforma</p>
                <p className="text-sm text-muted-foreground mt-1">Inclui demolição (parede, piso, revestimento).</p>
              </label>
              <label className={`rounded-lg border-2 p-4 cursor-pointer ${workType === "na_planta" ? "border-primary bg-primary/5" : "border-graphite bg-white"}`}>
                <input
                  type="radio"
                  name="workType"
                  className="sr-only"
                  checked={workType === "na_planta"}
                  onChange={() => setWorkType("na_planta")}
                />
                <p className="font-display uppercase tracking-wider text-sm">Na planta</p>
                <p className="text-sm text-muted-foreground mt-1">Estrutura pronta; esconde módulos de demolição.</p>
              </label>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de início</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetEndDate">Previsão de término</Label>
              <Input id="targetEndDate" name="targetEndDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalBudget">Orçamento total</Label>
            <CurrencyInput id="totalBudget" value={totalBudget} onValueChange={setTotalBudget} placeholder="R$ 0,00" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link href="/obras" className="text-sm text-muted-foreground underline-offset-4 hover:underline text-center sm:text-left">
          Cancelar
        </Link>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(loading)}
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (form) void create(form, "skip");
            }}
          >
            {loading === "skip" ? "Criando..." : "Pular"}
          </Button>
          <Button type="submit" disabled={Boolean(loading)}>
            {loading === "continue" ? "Continuando..." : "Continuar para a lista"}
          </Button>
        </div>
      </div>
    </form>
  );
}
