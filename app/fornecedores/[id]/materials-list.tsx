"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { MaterialDialog } from "./material-dialog";
import { getUnitLabel } from "@/lib/material-units";

interface MaterialData {
  id: string;
  projectId: string;
  budgetCategoryId: string | null;
  name: string;
  brand: string | null;
  unit: string;
  quantityPerUnit: string | null;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  status: string;
  purchaseDate: string | null;
  notes: string | null;
  createdAt: Date;
  projectName: string;
  categoryName: string | null;
}

interface MaterialsListProps {
  materials: MaterialData[];
  supplierId: string;
  projects: Array<{ id: string; name: string }>;
}

export function MaterialsList({ materials, supplierId, projects }: MaterialsListProps) {
  const router = useRouter();
  const [editingMaterial, setEditingMaterial] = useState<MaterialData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleStatus = async (material: MaterialData) => {
    setTogglingId(material.id);
    try {
      const response = await fetch(`/api/materiais/${material.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: material.status === "purchased" ? "quoted" : "purchased",
        }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Erro ao atualizar status da compra");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (materialId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fornecedores/${supplierId}/materiais/${materialId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir material");
      }

      setDeletingId(null);
      router.refresh();
    } catch (error) {
      console.error("Error deleting material:", error);
      alert("Erro ao excluir material");
    } finally {
      setLoading(false);
    }
  };

  if (materials.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="flex flex-col items-center justify-center h-32 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum material cadastrado. Clique em <strong>Novo Material</strong> para começar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {materials.map((material) => {
          const qty = parseFloat(material.quantity);
          const qtyPerUnit = material.quantityPerUnit ? parseFloat(material.quantityPerUnit) : null;
          const unitLabel = getUnitLabel(material.unit);

          return (
            <Card key={material.id} className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold">
                      {material.name}
                      {material.brand && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({material.brand})
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-muted">
                        {material.projectName}
                      </span>
                      {material.categoryName && (
                        <span className="px-2 py-1 rounded-full bg-accent/10 text-accent-foreground">
                          {material.categoryName}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full ${
                        material.status === "purchased" 
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
                      }`}>
                        {material.status === "purchased" ? "Comprado" : "Cotado"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      disabled={togglingId === material.id}
                      onClick={() => toggleStatus(material)}
                    >
                      {material.status === "purchased" ? "Desfazer compra" : "Marcar comprado"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingMaterial(material)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(material.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Quantidade</p>
                    <p className="font-data tabular-nums font-medium">
                      {qty} {unitLabel}
                      {qtyPerUnit && ` × ${qtyPerUnit}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Preço Unit.</p>
                    <p className="font-data tabular-nums font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(parseFloat(material.unitPrice))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="font-data tabular-nums font-semibold text-accent">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(parseFloat(material.totalPrice))}
                    </p>
                  </div>
                  {material.purchaseDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">Data Compra</p>
                      <p className="font-medium">
                        {new Date(material.purchaseDate + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
                {material.notes && (
                  <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
                    {material.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingMaterial && (
        <MaterialDialog
          open={true}
          onOpenChange={(open) => !open && setEditingMaterial(null)}
          supplierId={supplierId}
          projects={projects}
          material={editingMaterial}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !loading && setDeletingId(null)}
          />
          <div className="relative z-50 w-full max-w-md bg-white border rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setDeletingId(null)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deletingId)}
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
