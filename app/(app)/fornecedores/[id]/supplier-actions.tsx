"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierDialog } from "../supplier-dialog";
import type { Supplier } from "@/lib/db/schema";

interface SupplierActionsProps {
  supplier: Supplier;
}

export function SupplierActions({ supplier }: SupplierActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fornecedores/${supplier.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir fornecedor");
      }

      router.push("/fornecedores");
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Erro ao excluir fornecedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10 lg:left-64"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg bg-white border-2 border-graphite ds-shadow z-20">
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => {
                  setShowMenu(false);
                  setShowEditDialog(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </>
        )}
      </div>

      <SupplierDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        supplier={supplier}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !loading && setShowDeleteConfirm(false)}
          />
          <div className="relative z-50 w-full max-w-md overflow-hidden rounded-lg bg-white text-foreground border-2 border-graphite ds-shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja excluir o fornecedor <strong>{supplier.name}</strong>?
              Esta ação não pode ser desfeita e todos os materiais relacionados serão desvinculados.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
