"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ProgressBar } from "@/components/ds";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { CategoryDialog } from "./category-dialog";
import { afterMutation } from "@/lib/after-mutation";

interface Category {
  id: string;
  name: string;
  budgetedAmount: string;
  order: number;
  spent: string;
}

interface BudgetCategoriesListProps {
  projectId: string;
  categories: Category[];
}

export function BudgetCategoriesList({ projectId, categories }: BudgetCategoriesListProps) {
  const router = useRouter();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (categoryId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/obras/${projectId}/categorias/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir categoria");
      }

      setDeletingId(null);
      await afterMutation(() => router.refresh(), { projectId });
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Erro ao excluir categoria");
    } finally {
      setLoading(false);
    }
  };

  if (categories.length === 0) {
    return (
      <Card>
        <EmptyState
          illustration="plan"
          title="Nenhuma categoria"
          description="Clique em Nova Categoria para organizar o orçamento da obra."
        />
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {categories.map((category) => {
          const budgeted = parseFloat(category.budgetedAmount);
          const spent = parseFloat(category.spent);
          const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
          const remaining = budgeted - spent;

          return (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <button className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5" />
                  </button>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <div className="flex items-center gap-4 mt-1 font-data tabular-nums text-sm">
                          <span className="text-muted-foreground">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(spent)}
                          </span>
                          <span>
                            / {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(budgeted)}
                          </span>
                          {remaining !== 0 && (
                            <span className={remaining < 0 ? "text-destructive" : "text-muted-foreground"}>
                              ({remaining < 0 ? "+" : ""}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(Math.abs(remaining))})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ProgressBar value={percentage} className="flex-1" />
                      <span className="text-xs font-mono tabular-nums text-muted-foreground min-w-[3ch]">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingCategory && (
        <CategoryDialog
          open={true}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          projectId={projectId}
          category={editingCategory}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !loading && setDeletingId(null)}
          />
          <div className="relative z-50 w-full max-w-md overflow-hidden rounded-lg bg-white text-foreground border-2 border-graphite ds-shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
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
