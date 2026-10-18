import type { ChipFillToken } from "@/components/ds/chip";

export const ITEM_STATUSES = ["a_definir", "cotando", "comprado"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  a_definir: "A definir",
  cotando: "Cotando",
  comprado: "Comprado",
};

export const ITEM_STATUS_FILL: Record<ItemStatus, ChipFillToken> = {
  a_definir: "concrete",
  cotando: "signal-wash",
  comprado: "done-wash",
};

export const COMPRADO_STATUS_ALIASES = [
  "comprado",
  "purchased",
  "delivered",
  "received",
  "entregue",
  "recebido",
] as const;

const LEGACY_COMPRADO = new Set<string>(COMPRADO_STATUS_ALIASES);

const LEGACY_COTANDO = new Set(["quoted", "cotado", "cotando"]);

export function isItemStatus(value: string | null | undefined): value is ItemStatus {
  return value === "a_definir" || value === "cotando" || value === "comprado";
}

export function normalizeItemStatus(value: string | null | undefined): ItemStatus {
  const raw = (value || "").trim().toLowerCase();
  if (LEGACY_COMPRADO.has(raw) || raw === "comprado") return "comprado";
  if (LEGACY_COTANDO.has(raw) || raw === "cotando") return "cotando";
  if (raw === "a_definir" || raw === "a definir") return "a_definir";
  return "a_definir";
}

export function isCompradoStatus(value: string | null | undefined) {
  return normalizeItemStatus(value) === "comprado";
}

export function isToBuyStatus(value: string | null | undefined) {
  const status = normalizeItemStatus(value);
  return status === "a_definir" || status === "cotando";
}

export function needsSupplierStatus(value: string | null | undefined) {
  const status = normalizeItemStatus(value);
  return status === "cotando" || status === "comprado";
}

export function parseMoney(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function computeItemTotal(
  quantity: string | number | null | undefined,
  unitPrice: string | number | null | undefined
): string | null {
  const qty = parseMoney(quantity);
  const price = parseMoney(unitPrice);
  if (qty == null || price == null) return null;
  return (qty * price).toFixed(2);
}

export function emptyToNull(value: unknown): string | null {
  if (typeof value !== "string") return value == null ? null : String(value);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
