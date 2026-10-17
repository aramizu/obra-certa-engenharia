"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Alert, Select, Textarea } from "@/components/ds";
import { MATERIAL_UNITS, shouldShowQuantityPerUnit, getDefaultQuantity } from "@/lib/material-units";

interface Project {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

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
}

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  projects: Project[];
  material?: MaterialData;
}

export function MaterialDialog({ open, onOpenChange, supplierId, projects, material }: MaterialDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProject, setSelectedProject] = useState(material?.projectId || "");
  const [selectedUnit, setSelectedUnit] = useState(material?.unit || "un");
  const [quantity, setQuantity] = useState(material?.quantity || "1");
  const [quantityPerUnit, setQuantityPerUnit] = useState(material?.quantityPerUnit || "");
  const [unitPrice, setUnitPrice] = useState(material?.unitPrice || "0");
  const [status, setStatus] = useState(material?.status || "quoted");

  useEffect(() => {
    if (selectedProject) {
      fetchCategories(selectedProject);
    }
  }, [selectedProject]);

  const fetchCategories = async (projectId: string) => {
    try {
      const response = await fetch(`/api/obras/${projectId}/categorias-list`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return (qty * price).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      projectId: formData.get("projectId") as string,
      budgetCategoryId: formData.get("budgetCategoryId") as string || null,
      name: formData.get("name") as string,
      brand: formData.get("brand") as string || null,
      unit: selectedUnit,
      quantityPerUnit: shouldShowQuantityPerUnit(selectedUnit) ? quantityPerUnit : null,
      quantity,
      unitPrice,
      totalPrice: calculateTotal(),
      status,
      purchaseDate: status === "purchased" ? (formData.get("purchaseDate") as string || null) : null,
      notes: formData.get("notes") as string || null,
    };

    try {
      const url = material 
        ? `/api/fornecedores/${supplierId}/materiais/${material.id}` 
        : `/api/fornecedores/${supplierId}/materiais`;
      const method = material ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao salvar material");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar material");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{material ? "Editar Material" : "Novo Material"}</DialogTitle>
            <DialogDescription>
              {material ? "Atualize as informações do material" : "Adicione um material ou cotação"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            {error && (
              <Alert tone="danger">{error}</Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Obra *</Label>
                <Select
                  id="projectId"
                  name="projectId"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="h-10"
                  required
                >
                  <option value="">Selecione uma obra</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetCategoryId">Categoria do Orçamento</Label>
                <Select
                  id="budgetCategoryId"
                  name="budgetCategoryId"
                  defaultValue={material?.budgetCategoryId || ""}
                  className="h-10"
                  disabled={!selectedProject || categories.length === 0}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Material *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={material?.name}
                placeholder="Ex: Cimento CP-II, Areia média, Tijolo 8 furos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                name="brand"
                defaultValue={material?.brand || ""}
                placeholder="Ex: Votoran, Cauê, etc."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade *</Label>
                <Select
                  id="unit"
                  name="unit"
                  value={selectedUnit}
                  onChange={(e) => {
                    setSelectedUnit(e.target.value);
                    if (shouldShowQuantityPerUnit(e.target.value)) {
                      setQuantityPerUnit(getDefaultQuantity(e.target.value));
                    } else {
                      setQuantityPerUnit("");
                    }
                  }}
                  className="h-10"
                  required
                >
                  {MATERIAL_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </Select>
              </div>

              {shouldShowQuantityPerUnit(selectedUnit) && (
                <div className="space-y-2">
                  <Label htmlFor="quantityPerUnit">Conteúdo</Label>
                  <Input
                    id="quantityPerUnit"
                    name="quantityPerUnit"
                    type="number"
                    step="0.001"
                    value={quantityPerUnit}
                    onChange={(e) => setQuantityPerUnit(e.target.value)}
                    placeholder="Ex: 50, 100"
                  />
                  <p className="text-xs text-muted-foreground">kg, un, L, m</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Preço Unitário *</Label>
                <CurrencyInput
                  id="unitPrice"
                  value={unitPrice}
                  onValueChange={setUnitPrice}
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Total (R$)</Label>
                <div className="px-3 py-2 text-sm border-2 border-graphite bg-concrete font-mono tabular-nums">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(parseFloat(calculateTotal()))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10"
                  required
                >
                  <option value="quoted">Cotado</option>
                  <option value="purchased">Comprado</option>
                </Select>
              </div>

              {status === "purchased" && (
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Data da Compra</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    defaultValue={material?.purchaseDate || ""}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={material?.notes || ""}
                placeholder="Informações adicionais sobre o material"
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
