import { SEM_OBRA_LABEL } from "@/lib/user-tasks";

export const STOCK_MATERIAL_STATUSES = [
  "purchased",
  "delivered",
  "received",
  "comprado",
  "entregue",
  "recebido",
] as const;

export const SEM_OBRA_STOCK_KEY = "none";

export type StockMaterialStatus = (typeof STOCK_MATERIAL_STATUSES)[number];

export type StockItem = {
  id: string;
  name: string;
  brand: string | null;
  quantity: string;
  unit: string;
  totalPrice: string;
  purchaseDate: string | null;
  status: string;
  projectId: string | null;
  projectName: string | null;
  supplierId: string | null;
  supplierName: string | null;
};

export type StockGroup = {
  key: string;
  projectId: string | null;
  name: string;
  items: StockItem[];
  total: number;
};

export function isStockMaterialStatus(status: string | null | undefined): status is StockMaterialStatus {
  if (!status) return false;
  return (STOCK_MATERIAL_STATUSES as readonly string[]).includes(status.trim().toLowerCase());
}

export function stockItemHref(item: Pick<StockItem, "projectId" | "supplierId">) {
  if (item.projectId) return `/obras/${item.projectId}/lista`;
  if (item.supplierId) return `/fornecedores/${item.supplierId}`;
  return "/fornecedores";
}

export function formatQuantity(quantity: string, unit: string) {
  const n = Number(quantity);
  const qty = Number.isFinite(n)
    ? n.toLocaleString("pt-BR", { maximumFractionDigits: 3 })
    : quantity;
  const suffix = unit.trim();
  return suffix ? `${qty} ${suffix}` : qty;
}

export function groupStockByProject(items: StockItem[]): StockGroup[] {
  const map = new Map<string, StockGroup>();
  for (const item of items) {
    const key = item.projectId ?? SEM_OBRA_STOCK_KEY;
    const group = map.get(key) ?? {
      key,
      projectId: item.projectId,
      name: item.projectName?.trim() || SEM_OBRA_LABEL,
      items: [],
      total: 0,
    };
    group.items.push(item);
    group.total += parseFloat(item.totalPrice || "0") || 0;
    map.set(key, group);
  }

  const groups = [...map.values()];
  groups.sort((a, b) => {
    if (a.key === SEM_OBRA_STOCK_KEY) return 1;
    if (b.key === SEM_OBRA_STOCK_KEY) return -1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
  for (const group of groups) {
    group.items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
  return groups;
}
