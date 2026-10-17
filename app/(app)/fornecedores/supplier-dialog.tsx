"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Supplier } from "@/lib/db/schema";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      contact: formData.get("contact") as string || null,
      phone: formData.get("phone") as string || null,
      email: formData.get("email") as string || null,
      notes: formData.get("notes") as string || null,
    };

    try {
      const url = supplier ? `/api/fornecedores/${supplier.id}` : "/api/fornecedores";
      const method = supplier ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao salvar fornecedor");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar fornecedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{supplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            <DialogDescription>
              {supplier ? "Atualize as informações do fornecedor" : "Cadastre um novo fornecedor"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            {error && (
              <div className="text-sm text-delay rounded-md border-2 border-delay bg-delay-wash p-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={supplier?.name}
                placeholder="Ex: Depósito São Paulo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contato</Label>
              <Input
                id="contact"
                name="contact"
                defaultValue={supplier?.contact || ""}
                placeholder="Nome do contato"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={supplier?.phone || ""}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={supplier?.email || ""}
                  placeholder="contato@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                name="notes"
                defaultValue={supplier?.notes || ""}
                placeholder="Informações adicionais sobre o fornecedor"
                className="w-full min-h-[80px] rounded-md px-3 py-2 text-sm border-2 border-graphite bg-white"
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
