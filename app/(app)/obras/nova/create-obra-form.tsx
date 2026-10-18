"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
} from "@/components/ds";
import { CurrencyInput } from "@/components/ui/currency-input";
import { afterMutation } from "@/lib/after-mutation";

const FALLBACK_PRESETS = [
  { key: "blank", name: "Em branco", description: "Começa sem itens — cadastre o que for surgindo.", itemCount: 0 },
  { key: "piso", name: "Troca de piso", description: "Remoção, contrapiso e piso novo.", itemCount: 7 },
  { key: "drywall", name: "Parede de drywall", description: "Divisória em chapa ST.", itemCount: 5 },
  { key: "sacada", name: "Abrir sacada", description: "Demolição da vedação, piso e pintura.", itemCount: 6 },
];

type TemplateOption = {
  key: string;
  name: string;
  description?: string;
  itemCount?: number;
};

export function CreateObraForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalBudget, setTotalBudget] = useState("0");
  const [workType, setWorkType] = useState<"reforma" | "na_planta">("reforma");
  const [templateKey, setTemplateKey] = useState("blank");
  const [presets, setPresets] = useState<TemplateOption[]>(FALLBACK_PRESETS);
  const [userTemplates, setUserTemplates] = useState<TemplateOption[]>([]);

  useEffect(() => {
    void fetch("/api/modelos")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.presets) && data.presets.length) setPresets(data.presets);
        if (Array.isArray(data.user)) setUserTemplates(data.user);
      })
      .catch(() => {});
  }, []);

  const create = async (form: HTMLFormElement) => {
    setError(null);
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    if (!name) {
      setError("Informe o nome da obra.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/obras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address: (data.get("address") as string) || null,
          startDate: (data.get("startDate") as string) || null,
          targetEndDate: (data.get("targetEndDate") as string) || null,
          totalBudget,
          workType,
          templateKey,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao criar obra");
      await afterMutation(() => router.refresh(), { projectId: result.project.id });
      router.push(`/obras/${result.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar obra");
      setLoading(false);
    }
  };

  const selected =
    [...presets, ...userTemplates].find((option) => option.key === templateKey) ?? presets[0];

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void create(event.currentTarget);
      }}
    >
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Nova obra</CardTitle>
          <CardDescription>
            Cadastre a obra e, se quiser, comece com um modelo de itens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="name">Nome da obra *</Label>
            <Input id="name" name="name" placeholder="Ex: Apto 1204 — reforma" required className="bg-white" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" placeholder="Rua, número, bairro, cidade" className="bg-white" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateKey">Modelo de itens</Label>
            <Select
              id="templateKey"
              value={templateKey}
              onChange={(event) => setTemplateKey(event.target.value)}
            >
              {presets.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.name}
                </option>
              ))}
              {userTemplates.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.name}
                </option>
              ))}
            </Select>
            {selected?.description && (
              <p className="text-sm text-muted-foreground">{selected.description}</p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-label">Tipo</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`rounded-md border-2 p-4 cursor-pointer bg-white ${workType === "reforma" ? "border-primary" : "border-graphite"}`}>
                <input
                  type="radio"
                  name="workType"
                  className="sr-only"
                  checked={workType === "reforma"}
                  onChange={() => setWorkType("reforma")}
                />
                <p className="font-display uppercase tracking-wider text-sm">Reforma</p>
                <p className="text-sm text-muted-foreground mt-1">Obra em imóvel existente.</p>
              </label>
              <label className={`rounded-md border-2 p-4 cursor-pointer bg-white ${workType === "na_planta" ? "border-primary" : "border-graphite"}`}>
                <input
                  type="radio"
                  name="workType"
                  className="sr-only"
                  checked={workType === "na_planta"}
                  onChange={() => setWorkType("na_planta")}
                />
                <p className="font-display uppercase tracking-wider text-sm">Na planta</p>
                <p className="text-sm text-muted-foreground mt-1">Estrutura pronta.</p>
              </label>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de início</Label>
              <Input id="startDate" name="startDate" type="date" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetEndDate">Previsão de término</Label>
              <Input id="targetEndDate" name="targetEndDate" type="date" className="bg-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalBudget">Orçamento total</Label>
            <CurrencyInput id="totalBudget" value={totalBudget} onValueChange={setTotalBudget} placeholder="R$ 0,00" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link href="/obras" prefetch className="text-sm text-muted-foreground underline-offset-4 hover:underline text-center sm:text-left">
          Cancelar
        </Link>
        <Button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar obra"}
        </Button>
      </div>
    </form>
  );
}
