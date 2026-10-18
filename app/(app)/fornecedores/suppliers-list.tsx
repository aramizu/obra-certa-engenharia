"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/ds";
import { Pencil, Trash2, Phone, Mail, User } from "lucide-react";
import { SupplierDialog } from "./supplier-dialog";
import type { Supplier } from "@/lib/db/schema";
import { afterMutation } from "@/lib/after-mutation";

interface SuppliersListProps {
  suppliers: Supplier[];
}

export function SuppliersList({ suppliers }: SuppliersListProps) {
  const router = useRouter();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (supplierId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fornecedores/${supplierId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir fornecedor");
      }

      setDeletingId(null);
      await afterMutation(() => router.refresh(), { supplierId });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Erro ao excluir fornecedor");
    } finally {
      setLoading(false);
    }
  };

  if (suppliers.length === 0) {
    return (
      <Card>
        <EmptyState
          illustration="tape"
          title="Nenhum fornecedor cadastrado"
          description="Clique em Novo Fornecedor para começar o cadastro de materiais."
        />
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:border-accent transition-colors">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">{supplier.name}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSupplier(supplier)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingId(supplier.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {supplier.contact && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{supplier.contact}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.notes && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {supplier.notes}
                </p>
              )}
              <Link href={`/fornecedores/${supplier.id}`} prefetch>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Ver Materiais
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingSupplier && (
        <SupplierDialog
          open={true}
          onOpenChange={(open) => !open && setEditingSupplier(null)}
          supplier={editingSupplier}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
        loading={loading}
        onConfirm={() => {
          if (deletingId) void handleDelete(deletingId);
        }}
      />
    </>
  );
}
