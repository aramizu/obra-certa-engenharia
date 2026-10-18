"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ds";
import type { KnowledgeCatalog } from "@/lib/kb-catalog";
import { modulesForWorkType } from "@/lib/kb-engine";
import { formatQty } from "@/lib/kb-engine";
import { formatBRL } from "@/lib/format";
import { MATERIAL_UNITS } from "@/lib/material-units";
import type { Project, ProjectSuggestedItem, Supplier } from "@/lib/db/schema";

type RoomDraft = {
  key: string;
  name: string;
  areaM2: number;
  widthM: number | null;
  lengthM: number | null;
  perimeterM: number | null;
  ceilingHeightM: number;
  doors: number;
  windows: number;
  moduleIds: string[];
  packageIds: string[];
  extras: Record<string, number>;
};

type ListaItem = Pick<
  ProjectSuggestedItem,
  "id" | "name" | "unit" | "quantity" | "categoryId" | "categoryName" | "source" | "linkedMaterialId" | "kbMaterialId" | "sinapiCode"
>;

const PRESETS: { name: string; areaM2: number; doors: number; windows: number }[] = [
  { name: "Sala", areaM2: 20, doors: 1, windows: 2 },
  { name: "Cozinha", areaM2: 10, doors: 1, windows: 1 },
  { name: "Quarto", areaM2: 12, doors: 1, windows: 1 },
  { name: "Banheiro", areaM2: 5, doors: 1, windows: 1 },
  { name: "Sacada", areaM2: 4, doors: 1, windows: 0 },
  { name: "Lavanderia", areaM2: 4, doors: 1, windows: 1 },
];

function emptyRoom(name = ""): RoomDraft {
  return {
    key: crypto.randomUUID(),
    name,
    areaM2: 0,
    widthM: null,
    lengthM: null,
    perimeterM: null,
    ceilingHeightM: 2.7,
    doors: 1,
    windows: 0,
    moduleIds: [],
    packageIds: [],
    extras: {},
  };
}

function sortSuppliers(list: Supplier[], categoryName: string) {
  return [...list].sort((a, b) => {
    const aMatch = a.category === categoryName ? 0 : 1;
    const bMatch = b.category === categoryName ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function ListaView({
  project,
  catalog,
  initialRooms,
  initialItems,
  suppliers,
}: {
  project: Project;
  catalog: KnowledgeCatalog;
  initialRooms: RoomDraft[];
  initialItems: ListaItem[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"rooms" | "modules" | "list">(initialItems.length > 0 ? "list" : "rooms");
  const [workType, setWorkType] = useState<"reforma" | "na_planta">(
    project.workType === "na_planta" ? "na_planta" : "reforma"
  );
  const [rooms, setRooms] = useState<RoomDraft[]>(initialRooms.length ? initialRooms : [emptyRoom("Sala")]);
  const [items, setItems] = useState<ListaItem[]>(initialItems);
  const [supplierList, setSupplierList] = useState(suppliers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleModules = useMemo(() => modulesForWorkType(catalog, workType), [catalog, workType]);

  const updateRoom = (key: string, patch: Partial<RoomDraft>) => {
    setRooms((current) => current.map((room) => (room.key === key ? { ...room, ...patch } : room)));
  };

  const generate = async () => {
    setError(null);
    const valid = rooms.filter((room) => room.name.trim());
    if (!valid.length) {
      setError("Inclua pelo menos um cômodo com nome.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/obras/${project.id}/lista`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workType,
          rooms: valid.map((room) => ({
            name: room.name.trim(),
            areaM2: Number(room.areaM2) || 0,
            widthM: room.widthM,
            lengthM: room.lengthM,
            perimeterM: room.perimeterM,
            ceilingHeightM: room.ceilingHeightM,
            doors: room.doors,
            windows: room.windows,
            moduleIds: room.moduleIds,
            packageIds: room.packageIds,
            extras: room.extras,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao gerar lista");
      setItems(result.items);
      setStep("list");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar lista");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {project.name} · {workType === "na_planta" ? "Na planta" : "Reforma"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["rooms", "modules", "list"] as const).map((value, index) => (
              <button
                key={value}
                type="button"
                onClick={() => setStep(value)}
                className={`rounded-full border-2 px-3 py-1 text-xs font-display uppercase tracking-wider ${
                  step === value ? "border-graphite bg-primary text-primary-foreground" : "border-graphite bg-white"
                }`}
              >
                {index + 1}. {value === "rooms" ? "Cômodos" : value === "modules" ? "Módulos" : "Lista"}
              </button>
            ))}
          </div>
        </div>
        <Link href={`/obras/${project.id}`} className="text-sm underline-offset-4 hover:underline">
          Pular
        </Link>
      </div>

      {error && <div className="text-sm text-delay rounded-md border-2 border-delay bg-delay-wash p-3">{error}</div>}

      {step === "rooms" && (
        <RoomsStep
          workType={workType}
          setWorkType={setWorkType}
          rooms={rooms}
          setRooms={setRooms}
          updateRoom={updateRoom}
          onNext={() => setStep("modules")}
        />
      )}

      {step === "modules" && (
        <ModulesStep
          catalog={catalog}
          modules={visibleModules}
          rooms={rooms}
          updateRoom={updateRoom}
          loading={loading}
          onBack={() => setStep("rooms")}
          onGenerate={generate}
        />
      )}

      {step === "list" && (
        <ListStep
          projectId={project.id}
          catalog={catalog}
          items={items}
          setItems={setItems}
          suppliers={supplierList}
          setSuppliers={setSupplierList}
          onEditRooms={() => setStep("rooms")}
          onRegenerate={generate}
          loading={loading}
        />
      )}
    </div>
  );
}

function RoomsStep({
  workType,
  setWorkType,
  rooms,
  setRooms,
  updateRoom,
  onNext,
}: {
  workType: "reforma" | "na_planta";
  setWorkType: (value: "reforma" | "na_planta") => void;
  rooms: RoomDraft[];
  setRooms: (rooms: RoomDraft[]) => void;
  updateRoom: (key: string, patch: Partial<RoomDraft>) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tipo da obra</CardTitle>
          <CardDescription>Na planta esconde demolição nos módulos seguintes.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant={workType === "reforma" ? "default" : "outline"} onClick={() => setWorkType("reforma")}>
            Reforma
          </Button>
          <Button type="button" variant={workType === "na_planta" ? "default" : "outline"} onClick={() => setWorkType("na_planta")}>
            Na planta
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.name}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setRooms([...rooms, { ...emptyRoom(preset.name), ...preset }])}
          >
            + {preset.name}
          </Button>
        ))}
      </div>

      {rooms.map((room, index) => (
        <Card key={room.key}>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Cômodo {index + 1}</CardTitle>
              <CardDescription>Área em m², perímetro ou largura × comprimento, pé-direito e vãos.</CardDescription>
            </div>
            {rooms.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setRooms(rooms.filter((item) => item.key !== room.key))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome</Label>
              <Input value={room.name} onChange={(event) => updateRoom(room.key, { name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Área (m²)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={room.areaM2 || ""}
                onChange={(event) => updateRoom(room.key, { areaM2: Number(event.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pé-direito (m)</Label>
              <Input
                type="number"
                min={2}
                step="0.1"
                value={room.ceilingHeightM}
                onChange={(event) => updateRoom(room.key, { ceilingHeightM: Number(event.target.value) || 2.7 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Largura (m)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={room.widthM ?? ""}
                onChange={(event) => updateRoom(room.key, { widthM: event.target.value === "" ? null : Number(event.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Comprimento (m)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={room.lengthM ?? ""}
                onChange={(event) => updateRoom(room.key, { lengthM: event.target.value === "" ? null : Number(event.target.value) })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Perímetro (m) — se não informar dimensões</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={room.perimeterM ?? ""}
                onChange={(event) => updateRoom(room.key, { perimeterM: event.target.value === "" ? null : Number(event.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Portas</Label>
              <Input
                type="number"
                min={0}
                value={room.doors}
                onChange={(event) => updateRoom(room.key, { doors: Number(event.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Janelas</Label>
              <Input
                type="number"
                min={0}
                value={room.windows}
                onChange={(event) => updateRoom(room.key, { windows: Number(event.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={() => setRooms([...rooms, emptyRoom()])}>
        <Plus className="h-4 w-4 mr-2" />
        Outro cômodo
      </Button>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext}>
          Continuar
        </Button>
      </div>
    </div>
  );
}

function ModulesStep({
  catalog,
  modules,
  rooms,
  updateRoom,
  loading,
  onBack,
  onGenerate,
}: {
  catalog: KnowledgeCatalog;
  modules: KnowledgeCatalog["modules"];
  rooms: RoomDraft[];
  updateRoom: (key: string, patch: Partial<RoomDraft>) => void;
  loading: boolean;
  onBack: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <Card key={room.key}>
          <CardHeader>
            <CardTitle>{room.name || "Cômodo"}</CardTitle>
            <CardDescription>
              {room.areaM2} m² · pacotes e módulos. Informe pontos ou metros extras quando pedido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-label mb-2">Pacotes</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {catalog.packages.map((pkg) => {
                  const checked = room.packageIds.includes(pkg.id);
                  return (
                    <label key={pkg.id} className={`rounded-lg border-2 p-3 cursor-pointer ${checked ? "border-primary bg-primary/5" : "border-graphite bg-white"}`}>
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={checked}
                        onChange={() => {
                          const packageIds = checked
                            ? room.packageIds.filter((id) => id !== pkg.id)
                            : [...room.packageIds, pkg.id];
                          const extras = { ...room.extras };
                          if (!checked) {
                            for (const moduleId of pkg.moduleIds) {
                              const mod = modules.find((item) => item.id === moduleId);
                              if (!mod || extras[moduleId]) continue;
                              if (mod.extraKind === "points" && pkg.defaultPoints) extras[moduleId] = pkg.defaultPoints;
                              if (mod.extraKind === "count" && pkg.defaultCount) extras[moduleId] = pkg.defaultCount;
                              if (mod.extraKind === "wall_m" && pkg.defaultWallM) extras[moduleId] = pkg.defaultWallM;
                            }
                          }
                          updateRoom(room.key, { packageIds, extras });
                        }}
                      />
                      <span className="font-medium text-sm">{pkg.name}</span>
                      <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-label mb-2">Módulos</p>
              <div className="space-y-2">
                {modules.map((mod) => {
                  const checked = room.moduleIds.includes(mod.id) || catalog.packages.some((pkg) => room.packageIds.includes(pkg.id) && pkg.moduleIds.includes(mod.id));
                  return (
                    <div key={mod.id} className="rounded-md border-2 border-graphite bg-white p-3">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={room.moduleIds.includes(mod.id)}
                          onChange={() => {
                            const moduleIds = room.moduleIds.includes(mod.id)
                              ? room.moduleIds.filter((id) => id !== mod.id)
                              : [...room.moduleIds, mod.id];
                            updateRoom(room.key, { moduleIds });
                          }}
                        />
                        <span>
                          <span className="font-medium text-sm">{mod.name}</span>
                          {mod.isDemolition && (
                            <Badge tone="medium" className="ml-2">
                              Demolição
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </span>
                      </label>
                      {checked && mod.extraKind && (
                        <div className="mt-2 pl-6">
                          <Label>{mod.extraLabel || "Quantidade extra"}</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.1"
                            className="mt-1 max-w-xs"
                            value={room.extras[mod.id] ?? ""}
                            onChange={(event) =>
                              updateRoom(room.key, {
                                extras: { ...room.extras, [mod.id]: Number(event.target.value) || 0 },
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Voltar
        </Button>
        <Button type="button" onClick={onGenerate} disabled={loading}>
          {loading ? "Gerando..." : "Gerar lista sugerida"}
        </Button>
      </div>
    </div>
  );
}

function ListStep({
  projectId,
  catalog,
  items,
  setItems,
  suppliers,
  setSuppliers,
  onEditRooms,
  onRegenerate,
  loading,
}: {
  projectId: string;
  catalog: KnowledgeCatalog;
  items: ListaItem[];
  setItems: (items: ListaItem[]) => void;
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  onEditRooms: () => void;
  onRegenerate: () => void;
  loading: boolean;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, ListaItem[]>();
    for (const item of items) {
      const key = item.categoryName || "Outros";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Lista sugerida</h2>
          <p className="text-sm text-muted-foreground">
            Curadoria: edite quantidades, remova ou adicione. Vincule fornecedor com preço em R$ para entrar no orçamento e no Para comprar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onEditRooms}>
            Editar cômodos
          </Button>
          <Button type="button" variant="secondary" onClick={onRegenerate} disabled={loading}>
            Recalcular
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Nenhuma lista ainda. Volte aos cômodos e módulos e gere a sugestão.
          </CardContent>
        </Card>
      ) : (
        grouped.map(([category, rows]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.map((item) => (
                <ItemRow
                  key={`${item.id}-${item.quantity}`}
                  projectId={projectId}
                  item={item}
                  suppliers={sortSuppliers(suppliers, item.categoryName)}
                  onChange={(next) => setItems(items.map((row) => (row.id === next.id ? next : row)))}
                  onRemove={() => setItems(items.filter((row) => row.id !== item.id))}
                  onSupplier={(supplier) => {
                    if (!suppliers.some((row) => row.id === supplier.id)) setSuppliers([...suppliers, supplier]);
                  }}
                />
              ))}
            </CardContent>
          </Card>
        ))
      )}

      <AddItemForm
        projectId={projectId}
        catalog={catalog}
        onAdd={(item) => setItems([...items, item])}
      />
    </div>
  );
}

function ItemRow({
  projectId,
  item,
  suppliers,
  onChange,
  onRemove,
  onSupplier,
}: {
  projectId: string;
  item: ListaItem;
  suppliers: Supplier[];
  onChange: (item: ListaItem) => void;
  onRemove: () => void;
  onSupplier: (supplier: Supplier) => void;
}) {
  const [qty, setQty] = useState(String(item.quantity));
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "new");
  const [newName, setNewName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveQty = async () => {
    const quantity = Number(qty.replace(",", "."));
    if (!quantity || quantity === Number(item.quantity)) return;
    const response = await fetch(`/api/obras/${projectId}/lista/itens/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const result = await response.json();
    if (response.ok) onChange(result.item);
  };

  const remove = async () => {
    if (!confirm("Remover este item da lista da obra?")) return;
    const response = await fetch(`/api/obras/${projectId}/lista/itens/${item.id}`, { method: "DELETE" });
    if (response.ok) onRemove();
  };

  const link = async () => {
    setError(null);
    setBusy(true);
    try {
      const usingNew = supplierId === "new";
      const response = await fetch(`/api/obras/${projectId}/lista/itens/${item.id}/vincular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: usingNew ? undefined : supplierId,
          newSupplier: usingNew ? { name: newName, category: item.categoryName } : undefined,
          unitPrice: price,
          brand: brand || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao vincular");
      onChange(result.item);
      if (result.supplier) onSupplier(result.supplier);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao vincular");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-graphite bg-white p-3 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.categoryName}
            {item.sinapiCode ? ` · SINAPI ${item.sinapiCode}` : ""}
            {item.source === "custom" ? " · extra" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="w-28 font-mono"
            value={qty}
            onChange={(event) => setQty(event.target.value)}
            onBlur={() => void saveQty()}
          />
          <span className="text-sm text-muted-foreground w-12">{item.unit}</span>
          <Button type="button" variant="ghost" size="icon" onClick={() => void remove()}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {item.linkedMaterialId ? (
        <Badge tone="quoted">No orçamento · Para comprar</Badge>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
                {supplier.category ? ` (${supplier.category})` : ""}
              </option>
            ))}
            <option value="new">Novo fornecedor…</option>
          </Select>
          {supplierId === "new" && (
            <Input placeholder="Nome do fornecedor" value={newName} onChange={(event) => setNewName(event.target.value)} />
          )}
          <Input placeholder="Marca" value={brand} onChange={(event) => setBrand(event.target.value)} />
          <CurrencyInput value={price} onValueChange={setPrice} placeholder="R$ 0,00" />
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
            <Button type="button" size="sm" onClick={() => void link()} disabled={busy}>
              {busy ? "Vinculando..." : "Vincular ao orçamento"}
            </Button>
            {Number(price) > 0 && (
              <span className="text-xs font-mono text-muted-foreground">
                Total {formatBRL(Number(item.quantity) * Number(price))} · {formatQty(Number(item.quantity))} {item.unit}
              </span>
            )}
          </div>
          {error && <p className="text-sm text-delay sm:col-span-2 lg:col-span-4">{error}</p>}
        </div>
      )}
    </div>
  );
}

function AddItemForm({
  projectId,
  catalog,
  onAdd,
}: {
  projectId: string;
  catalog: KnowledgeCatalog;
  onAdd: (item: ListaItem) => void;
}) {
  const [materialId, setMaterialId] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("un");
  const [quantity, setQuantity] = useState("1");
  const [categoryId, setCategoryId] = useState(catalog.categories[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const material = catalog.materials.find((item) => item.id === materialId);
    const category = catalog.categories.find((item) => item.id === (material?.categoryId || categoryId));
    setBusy(true);
    try {
      const response = await fetch(`/api/obras/${projectId}/lista/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: material?.name || name,
          unit: material?.unit || unit,
          quantity: Number(quantity.replace(",", ".")),
          categoryId: category?.id ?? null,
          categoryName: category?.name || "Outros",
          kbMaterialId: material?.id ?? null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao adicionar");
      onAdd(result.item);
      setName("");
      setMaterialId("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar item</CardTitle>
        <CardDescription>Escolha um material da base ou cadastre um avulso.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          value={materialId}
          onChange={(event) => {
            setMaterialId(event.target.value);
            const material = catalog.materials.find((item) => item.id === event.target.value);
            if (material) {
              setName(material.name);
              setUnit(material.unit);
              setCategoryId(material.categoryId);
            }
          }}
        >
          <option value="">Material da base…</option>
          {catalog.materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name}
            </option>
          ))}
        </Select>
        <Input placeholder="Nome" value={name} onChange={(event) => setName(event.target.value)} />
        <Select value={unit} onChange={(event) => setUnit(event.target.value)}>
          {MATERIAL_UNITS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input type="number" min={0} step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        <Button type="button" onClick={() => void submit()} disabled={busy || !name}>
          Adicionar
        </Button>
      </CardContent>
    </Card>
  );
}
