"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { KnowledgeCatalog } from "@/lib/kb-catalog";

export function AdminBaseView({ initialCatalog }: { initialCatalog: KnowledgeCatalog }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const materialsByCategory = useMemo(() => {
    return catalog.categories.map((category) => ({
      category,
      materials: catalog.materials.filter((item) => item.categoryId === category.id),
    }));
  }, [catalog]);

  const patch = async (body: Record<string, unknown>, id: string) => {
    setSaving(id);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/kb", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao salvar");
      setMessage("Alteração salva na base global.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Ajustes aqui valem para todas as obras. Excluir uma obra não apaga esta base.
      </p>
      {message && <div className="rounded-md border-2 border-graphite bg-white p-3 text-sm">{message}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Categorias de fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {catalog.categories.map((category) => (
            <div key={category.id} className="flex flex-col sm:flex-row gap-2">
              <Input
                value={category.name}
                onChange={(event) =>
                  setCatalog({
                    ...catalog,
                    categories: catalog.categories.map((item) =>
                      item.id === category.id ? { ...item, name: event.target.value } : item
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="outline"
                disabled={saving === category.id}
                onClick={() => void patch({ kind: "category", id: category.id, name: category.name }, category.id)}
              >
                Salvar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {materialsByCategory.map(({ category, materials }) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle>{category.name}</CardTitle>
            <CardDescription>Materiais de referência (unidade, código SINAPI, notas).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {materials.map((material) => (
              <div key={material.id} className="rounded-lg border-2 border-graphite p-3 grid gap-2 sm:grid-cols-2">
                <Input
                  value={material.name}
                  onChange={(event) =>
                    setCatalog({
                      ...catalog,
                      materials: catalog.materials.map((item) =>
                        item.id === material.id ? { ...item, name: event.target.value } : item
                      ),
                    })
                  }
                />
                <Input
                  value={material.unit}
                  onChange={(event) =>
                    setCatalog({
                      ...catalog,
                      materials: catalog.materials.map((item) =>
                        item.id === material.id ? { ...item, unit: event.target.value } : item
                      ),
                    })
                  }
                />
                <Input
                  placeholder="SINAPI"
                  value={material.sinapiCode ?? ""}
                  onChange={(event) =>
                    setCatalog({
                      ...catalog,
                      materials: catalog.materials.map((item) =>
                        item.id === material.id ? { ...item, sinapiCode: event.target.value || null } : item
                      ),
                    })
                  }
                />
                <Select
                  value={material.categoryId}
                  onChange={(event) =>
                    setCatalog({
                      ...catalog,
                      materials: catalog.materials.map((item) =>
                        item.id === material.id ? { ...item, categoryId: event.target.value } : item
                      ),
                    })
                  }
                >
                  {catalog.categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving === material.id}
                    onClick={() =>
                      void patch(
                        {
                          kind: "material",
                          id: material.id,
                          name: material.name,
                          unit: material.unit,
                          categoryId: material.categoryId,
                          sinapiCode: material.sinapiCode,
                          notes: material.notes,
                        },
                        material.id
                      )
                    }
                  >
                    Salvar material
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Consumos e perda</CardTitle>
          <CardDescription>Consumo por unidade do módulo × (1 + perda%).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {catalog.modules.map((mod) => {
            const comps = catalog.compositions.filter((item) => item.moduleId === mod.id);
            if (!comps.length) return null;
            return (
              <div key={mod.id} className="space-y-2">
                <p className="font-display uppercase tracking-wider text-sm">{mod.name}</p>
                {comps.map((comp) => {
                  const material = catalog.materials.find((item) => item.id === comp.materialId);
                  return (
                    <div key={comp.id} className="grid gap-2 sm:grid-cols-4 items-center">
                      <p className="text-sm sm:col-span-2">{material?.name ?? comp.materialId}</p>
                      <Input
                        type="number"
                        step="0.0001"
                        value={comp.consumption}
                        onChange={(event) =>
                          setCatalog({
                            ...catalog,
                            compositions: catalog.compositions.map((item) =>
                              item.id === comp.id ? { ...item, consumption: Number(event.target.value) || 0 } : item
                            ),
                          })
                        }
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={comp.wastePct}
                          onChange={(event) =>
                            setCatalog({
                              ...catalog,
                              compositions: catalog.compositions.map((item) =>
                                item.id === comp.id ? { ...item, wastePct: Number(event.target.value) || 0 } : item
                              ),
                            })
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={saving === comp.id}
                          onClick={() =>
                            void patch(
                              {
                                kind: "composition",
                                id: comp.id,
                                consumption: comp.consumption,
                                wastePct: comp.wastePct,
                                sinapiCode: comp.sinapiCode,
                              },
                              comp.id
                            )
                          }
                        >
                          OK
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
