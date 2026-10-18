"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { afterMutation } from "@/lib/after-mutation";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  category?: {
    id: string;
    name: string;
    budgetedAmount: string;
  };
}

export function CategoryDialog({ open, onOpenChange, projectId, category }: CategoryDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetedAmount, setBudgetedAmount] = useState(category?.budgetedAmount || "0");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      budgetedAmount,
    };

    try {
      const url = category
        ? `/api/obras/${projectId}/categorias/${category.id}`
        : `/api/obras/${projectId}/categorias`;
      const method = category ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao salvar categoria");
      }

      onOpenChange(false);
      await afterMutation(() => router.refresh(), { projectId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {category ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {category
                ? "Atualize as informações da categoria"
                : "Adicione uma categoria ao orçamento (ex: Fundação, Estrutura, Acabamento)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            {error && (
              <div className="text-sm text-delay rounded-md border-2 border-delay bg-delay-wash p-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={category?.name}
                placeholder="Ex: Fundação, Estrutura, Elétrica"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetedAmount">Valor Orçado</Label>
              <CurrencyInput
                id="budgetedAmount"
                value={budgetedAmount}
                onValueChange={setBudgetedAmount}
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
