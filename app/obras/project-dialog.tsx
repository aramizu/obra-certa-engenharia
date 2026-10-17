"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import type { Project } from "@/lib/db/schema";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalBudget, setTotalBudget] = useState(project?.totalBudget || "0");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      address: formData.get("address") as string || null,
      startDate: formData.get("startDate") as string || null,
      targetEndDate: formData.get("targetEndDate") as string || null,
      totalBudget,
    };

    try {
      const url = project ? `/api/obras/${project.id}` : "/api/obras";
      const method = project ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao salvar obra");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar obra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{project ? "Editar Obra" : "Nova Obra"}</DialogTitle>
            <DialogDescription>
              {project ? "Atualize as informações da obra" : "Crie uma nova obra e defina o orçamento"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome da Obra *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={project?.name}
                placeholder="Ex: Construção Casa Nova"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                name="address"
                defaultValue={project?.address || ""}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={project?.startDate || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetEndDate">Previsão de Término</Label>
                <Input
                  id="targetEndDate"
                  name="targetEndDate"
                  type="date"
                  defaultValue={project?.targetEndDate || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalBudget">Orçamento Total</Label>
              <CurrencyInput
                id="totalBudget"
                value={totalBudget}
                onValueChange={setTotalBudget}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
