"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PILL_CHIP_CLASS,
  Select,
  chipContrastStyle,
} from "@/components/ds";
import { CurrencyInput } from "@/components/ui/currency-input";
import { afterMutation } from "@/lib/after-mutation";
import { formatBRL } from "@/lib/format";
import {
  ITEM_STATUSES,
  ITEM_STATUS_FILL,
  ITEM_STATUS_LABEL,
  computeItemTotal,
  needsSupplierStatus,
  normalizeItemStatus,
  parseMoney,
  type ItemStatus,
} from "@/lib/item-status";
import { parseItemLine } from "@/lib/parse-item-line";
import { MATERIAL_UNITS } from "@/lib/material-units";
import { cn } from "@/lib/utils";

export type ObraItemRow = {
  id: string;
  name: string;
  brand: string | null;
  unit: string | null;
  quantity: string | null;
  unitPrice: string | null;
  totalPrice: string | null;
  status: string;
  notes: string | null;
  supplierId: string | null;
  budgetCategoryId: string | null;
  kbRefId: string | null;
  kbRefCode: string | null;
  refUnit: string | null;
  refUnitPrice: string | null;
  groupName: string | null;
  supplierName: string | null;
};

export type ObraGroup = {
  id: string;
  name: string;
  budgetedAmount: string;
  order: number;
};

type SupplierOption = { id: string; name: string };

function money(value: string | null | undefined) {
  return parseMoney(value) ?? 0;
}

function StatusChip({ status }: { status: string }) {
  const normalized = normalizeItemStatus(status);
  const fill = ITEM_STATUS_FILL[normalized];
  return (
    <span
      className={`${PILL_CHIP_CLASS} px-2 py-0.5 text-[10px] font-display uppercase tracking-widest`}
      data-fill={fill}
      style={chipContrastStyle(fill)}
    >
      {ITEM_STATUS_LABEL[normalized]}
    </span>
  );
}

export function ObraItemsView({
  projectId,
  items: initialItems,
  groups: initialGroups,
  suppliers: initialSuppliers,
  archived,
}: {
  projectId: string;
  items: ObraItemRow[];
  groups: ObraGroup[];
  suppliers: SupplierOption[];
  archived: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [groups, setGroups] = useState(initialGroups);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<ObraItemRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newGroup, setNewGroup] = useState("");
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    setItems(initialItems);
    setGroups(initialGroups);
    setSuppliers(initialSuppliers);
  }, [initialItems, initialGroups, initialSuppliers]);

  const grouped = useMemo(() => {
    const map = new Map<string, ObraItemRow[]>();
    const ungrouped: ObraItemRow[] = [];
    for (const item of items) {
      if (!item.budgetCategoryId) ungrouped.push(item);
      else {
        const list = map.get(item.budgetCategoryId) ?? [];
        list.push(item);
        map.set(item.budgetCategoryId, list);
      }
    }
    const ordered = [...groups]
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "pt-BR"))
      .map((group) => ({ group, items: map.get(group.id) ?? [] }));
    return { ordered, ungrouped };
  }, [groups, items]);

  const totals = useMemo(() => {
    const orcado = items.reduce((sum, item) => sum + money(item.totalPrice), 0);
    const comprado = items
      .filter((item) => normalizeItemStatus(item.status) === "comprado")
      .reduce((sum, item) => sum + money(item.totalPrice), 0);
    return { orcado, comprado };
  }, [items]);

  const refresh = () => afterMutation(() => router.refresh(), { projectId });

  const addQuick = async (event?: { preventDefault(): void }) => {
    event?.preventDefault();
    const parsed = parseItemLine(draft);
    if (!parsed.name) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: parsed.name,
        quantity: parsed.quantity == null ? null : String(parsed.quantity),
        unit: parsed.unit,
        unitPrice: parsed.unitPrice == null ? null : String(parsed.unitPrice),
        status: "a_definir",
      };
      const response = await fetch(`/api/obras/${projectId}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao adicionar");
      setItems((current) => [...current, { ...result.item, groupName: null, supplierName: null }]);
      setDraft("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar");
    } finally {
      setBusy(false);
    }
  };

  const createGroup = async () => {
    const name = newGroup.trim();
    if (!name) return;
    const response = await fetch(`/api/obras/${projectId}/grupos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Erro ao criar grupo");
      return;
    }
    setGroups((current) => [...current, result.group]);
    setNewGroup("");
    await refresh();
  };

  const saveTemplate = async () => {
    const name = templateName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/obras/${projectId}/modelo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao salvar modelo");
      setTemplateName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar modelo");
    } finally {
      setBusy(false);
    }
  };

  const groupTotal = (list: ObraItemRow[]) => ({
    orcado: list.reduce((sum, item) => sum + money(item.totalPrice), 0),
    comprado: list
      .filter((item) => normalizeItemStatus(item.status) === "comprado")
      .reduce((sum, item) => sum + money(item.totalPrice), 0),
  });

  const toggle = (key: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}

      {!archived && (
        <form onSubmit={(event) => void addQuick(event)}>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Adicionar: piso vinílico 35 m2 R$ 89"
            className="h-11 bg-white"
            disabled={busy}
            autoComplete="off"
          />
        </form>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-md border-2 border-graphite bg-white p-3">
        <div>
          <p className="text-xs text-muted-foreground">Total da obra</p>
          <p className="font-mono text-lg font-semibold tabular-nums">
            {formatBRL(totals.orcado)} <span className="text-sm font-normal text-muted-foreground">orçado</span>
            {" · "}
            {formatBRL(totals.comprado)} <span className="text-sm font-normal text-muted-foreground">comprado</span>
          </p>
        </div>
        {!archived && (
          <div className="flex flex-wrap gap-2">
            <Input
              value={newGroup}
              onChange={(event) => setNewGroup(event.target.value)}
              placeholder="Novo grupo (Sala, Elétrica…)"
              className="h-10 w-48 bg-white"
            />
            <Button type="button" variant="outline" onClick={() => void createGroup()}>
              <Plus className="mr-1 h-4 w-4" />
              Grupo
            </Button>
          </div>
        )}
      </div>

      {grouped.ordered.map(({ group, items: list }) => {
        const open = !collapsed.has(group.id);
        const t = groupTotal(list);
        const teto = money(group.budgetedAmount);
        return (
          <Card key={group.id} className="bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => toggle(group.id)}
            >
              <span className="flex items-center gap-2">
                <ChevronDown className={cn("h-4 w-4 transition", open ? "" : "-rotate-90")} />
                <span className="font-display text-sm uppercase tracking-wider">{group.name}</span>
                <span className="text-xs text-muted-foreground">{list.length}</span>
              </span>
              <span className="font-mono text-sm tabular-nums">
                {formatBRL(t.orcado)} / {formatBRL(t.comprado)}
                {teto > 0 ? ` · teto ${formatBRL(teto)}` : ""}
              </span>
            </button>
            {open && (
              <CardContent className="space-y-2 border-t-2 border-graphite pt-3">
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item neste grupo.</p>
                ) : (
                  list.map((item) => (
                    <ItemButton key={item.id} item={item} onOpen={() => setEditing(item)} />
                  ))
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      <Card className="bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() => toggle("none")}
        >
          <span className="flex items-center gap-2">
            <ChevronDown className={cn("h-4 w-4 transition", collapsed.has("none") ? "-rotate-90" : "")} />
            <span className="font-display text-sm uppercase tracking-wider">Sem grupo</span>
            <span className="text-xs text-muted-foreground">{grouped.ungrouped.length}</span>
          </span>
          <span className="font-mono text-sm tabular-nums">
            {formatBRL(groupTotal(grouped.ungrouped).orcado)}
          </span>
        </button>
        {!collapsed.has("none") && (
          <CardContent className="space-y-2 border-t-2 border-graphite pt-3">
            {grouped.ungrouped.length === 0 ? (
              <p className="text-sm text-muted-foreground">Itens sem grupo aparecem aqui.</p>
            ) : (
              grouped.ungrouped.map((item) => (
                <ItemButton key={item.id} item={item} onOpen={() => setEditing(item)} />
              ))
            )}
          </CardContent>
        )}
      </Card>

      {!archived && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            placeholder="Nome do modelo"
            className="h-10 max-w-xs bg-white"
          />
          <Button type="button" variant="outline" disabled={busy || !templateName.trim()} onClick={() => void saveTemplate()}>
            Salvar como modelo
          </Button>
        </div>
      )}

      {editing && (
        <ItemEditor
          item={editing}
          projectId={projectId}
          groups={groups}
          suppliers={suppliers}
          archived={archived}
          onClose={() => setEditing(null)}
          onSaved={async (next, extra) => {
            if (extra?.supplier) {
              setSuppliers((current) =>
                current.some((row) => row.id === extra.supplier!.id) ? current : [...current, extra.supplier!]
              );
            }
            if (extra?.deleted) {
              setItems((current) => current.filter((row) => row.id !== editing.id));
            } else if (next) {
              setItems((current) => current.map((row) => (row.id === next.id ? next : row)));
            }
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function ItemButton({ item, onOpen }: { item: ObraItemRow; onOpen: () => void }) {
  const qty = item.quantity ? `${item.quantity.replace(".", ",")}${item.unit ? ` ${item.unit}` : ""}` : item.unit;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-1 rounded-md border-2 border-graphite bg-white px-3 py-2 text-left hover:bg-concrete sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{item.name}</span>
        <span className="flex flex-wrap items-center gap-2">
          <StatusChip status={item.status} />
        </span>
      </span>
      <span className="shrink-0 text-right font-mono text-sm tabular-nums">
        {qty ? <span className="mr-3 text-muted-foreground">{qty}</span> : null}
        {item.totalPrice ? formatBRL(money(item.totalPrice)) : "—"}
      </span>
    </button>
  );
}

function ItemEditor({
  item,
  projectId,
  groups,
  suppliers,
  archived,
  onClose,
  onSaved,
}: {
  item: ObraItemRow;
  projectId: string;
  groups: ObraGroup[];
  suppliers: SupplierOption[];
  archived: boolean;
  onClose: () => void;
  onSaved: (
    item: ObraItemRow | null,
    extra?: { supplier?: SupplierOption; deleted?: boolean }
  ) => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity || "");
  const [unit, setUnit] = useState(item.unit || "");
  const [unitPrice, setUnitPrice] = useState(item.unitPrice || "0");
  const [status, setStatus] = useState<ItemStatus>(normalizeItemStatus(item.status));
  const [groupId, setGroupId] = useState(item.budgetCategoryId || "");
  const [groupName, setGroupName] = useState("");
  const [supplierId, setSupplierId] = useState(item.supplierId || "");
  const [newSupplier, setNewSupplier] = useState("");
  const [notes, setNotes] = useState(item.notes || "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/obras/${projectId}/itens/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          quantity: quantity || null,
          unit: unit || null,
          unitPrice: parseMoney(unitPrice) == null ? null : unitPrice,
          status,
          budgetCategoryId: groupName.trim() ? null : groupId || null,
          groupName: groupName.trim() || null,
          clearGroup: !groupName.trim() && !groupId,
          supplierId: needsSupplierStatus(status) ? (supplierId === "new" ? null : supplierId || null) : item.supplierId,
          newSupplierName: needsSupplierStatus(status) && supplierId === "new" ? newSupplier : null,
          notes: notes || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao salvar");
      const saved = result.item as ObraItemRow;
      await onSaved(
        {
          ...item,
          ...saved,
          groupName: groupName.trim() || groups.find((g) => g.id === saved.budgetCategoryId)?.name || null,
          supplierName:
            supplierId === "new"
              ? newSupplier
              : suppliers.find((row) => row.id === saved.supplierId)?.name || null,
        },
        supplierId === "new" && saved.supplierId
          ? { supplier: { id: saved.supplierId, name: newSupplier } }
          : undefined
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Excluir este item?")) return;
    setBusy(true);
    const response = await fetch(`/api/obras/${projectId}/itens/${item.id}`, { method: "DELETE" });
    if (!response.ok) {
      setBusy(false);
      setError("Erro ao excluir");
      return;
    }
    await onSaved(null, { deleted: true });
  };

  const total = computeItemTotal(quantity || null, unitPrice);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <DialogHeader>
            <DialogTitle>Item da obra</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {error && <Alert tone="danger">{error}</Alert>}
            <div className="space-y-2">
              <Label htmlFor="item-name">Nome *</Label>
              <Input id="item-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="item-qty">Qtd</Label>
                <Input id="item-qty" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-unit">Unidade</Label>
                <Select id="item-unit" value={unit} onChange={(event) => setUnit(event.target.value)}>
                  <option value="">—</option>
                  {MATERIAL_UNITS.map((row) => (
                    <option key={row.value} value={row.value}>
                      {row.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preço un.</Label>
                <CurrencyInput value={unitPrice} onValueChange={setUnitPrice} />
              </div>
            </div>
            <p className="font-mono text-sm tabular-nums text-muted-foreground">
              Total {total ? formatBRL(Number(total)) : "—"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onChange={(event) => setStatus(event.target.value as ItemStatus)}>
                  {ITEM_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {ITEM_STATUS_LABEL[value]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select
                  value={groupId}
                  onChange={(event) => {
                    setGroupId(event.target.value);
                    setGroupName("");
                  }}
                >
                  <option value="">Sem grupo</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
                <Input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Ou crie um grupo…"
                  className="bg-white"
                />
              </div>
            </div>
            {needsSupplierStatus(status) && (
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                  <option value="">Selecione…</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                  <option value="new">Novo fornecedor</option>
                </Select>
                {supplierId === "new" && (
                  <Input
                    value={newSupplier}
                    onChange={(event) => setNewSupplier(event.target.value)}
                    placeholder="Nome do fornecedor"
                    required
                  />
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="item-notes">Observações</Label>
              <Input id="item-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            {!archived && (
              <Button type="button" variant="ghost" disabled={busy} onClick={() => void remove()}>
                <Trash2 className="mr-1 h-4 w-4" />
                Excluir
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            {!archived && (
              <Button type="submit" disabled={busy}>
                {busy ? "Salvando…" : "Salvar"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
