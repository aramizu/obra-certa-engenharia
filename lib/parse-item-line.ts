import { emptyToNull } from "@/lib/item-status";

export type ParsedItemLine = {
  name: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
};

const UNIT_MAP: Array<{ pattern: RegExp; unit: string }> = [
  { pattern: /m[²2]|metros?\s*quadrados?/i, unit: "m2" },
  { pattern: /m[³3]|metros?\s*c[uú]bicos?/i, unit: "m3" },
  { pattern: /milheiros?/i, unit: "milheiro" },
  { pattern: /unidades?|unids?|unds?/i, unit: "un" },
  { pattern: /sacos?/i, unit: "saco" },
  { pattern: /caixas?/i, unit: "caixa" },
  { pattern: /pacotes?/i, unit: "pacote" },
  { pattern: /barras?/i, unit: "barra" },
  { pattern: /latas?/i, unit: "lata" },
  { pattern: /gal[oõ]es?|galao/i, unit: "galao" },
  { pattern: /baldes?/i, unit: "balde" },
  { pattern: /rolos?/i, unit: "rolo" },
  { pattern: /placas?/i, unit: "placa" },
  { pattern: /pe[cç]as?/i, unit: "peça" },
  { pattern: /litros?|\blts?\b/i, unit: "l" },
  { pattern: /\bkg\b/i, unit: "kg" },
  { pattern: /\buns?\b/i, unit: "un" },
  { pattern: /\bm\b/i, unit: "m" },
  { pattern: /\bl\b/i, unit: "l" },
  { pattern: /\bg\b/i, unit: "g" },
  { pattern: /\bt\b/i, unit: "t" },
];

const NUMBER_RE = "\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?|\\d+(?:[.,]\\d+)?";

export function parseBrNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = raw.trim().replace(/r\$\s*/gi, "").replace(/\s/g, "");
  if (!trimmed) return null;
  let normalized = trimmed;
  if (trimmed.includes(",") && trimmed.includes(".")) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (trimmed.includes(",")) {
    normalized = trimmed.replace(",", ".");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function matchUnit(token: string): string | null {
  for (const entry of UNIT_MAP) {
    const exact = new RegExp(`^(?:${entry.pattern.source})$`, entry.pattern.flags);
    if (exact.test(token)) return entry.unit;
  }
  return null;
}

export function parseItemLine(input: string): ParsedItemLine {
  const original = input.replace(/\s+/g, " ").trim();
  if (!original) return { name: "", quantity: null, unit: null, unitPrice: null };

  let rest = original;
  let unitPrice: number | null = null;
  let quantity: number | null = null;
  let unit: string | null = null;

  const money = rest.match(new RegExp(`(?:r\\$\\s*)(${NUMBER_RE})\\s*$`, "i"));
  if (money) {
    unitPrice = parseBrNumber(money[1]);
    rest = rest.slice(0, money.index).trim();
  }

  const qtyUnit = rest.match(new RegExp(`(?:^|\\s)(${NUMBER_RE})\\s+([A-Za-zÀ-ÿ²³0-9]+)\\b`));
  if (qtyUnit) {
    const foundUnit = matchUnit(qtyUnit[2]);
    if (foundUnit) {
      quantity = parseBrNumber(qtyUnit[1]);
      unit = foundUnit;
      rest = (rest.slice(0, qtyUnit.index) + " " + rest.slice((qtyUnit.index ?? 0) + qtyUnit[0].length)).trim();
    }
  }

  if (quantity == null) {
    const leading = rest.match(new RegExp(`^(${NUMBER_RE})\\s+(.+)$`));
    if (leading) {
      const maybeUnit = leading[2].split(" ")[0];
      const foundUnit = matchUnit(maybeUnit);
      if (foundUnit) {
        quantity = parseBrNumber(leading[1]);
        unit = foundUnit;
        rest = leading[2].slice(maybeUnit.length).trim();
      }
    }
  }

  if (unitPrice == null) {
    const trailing = rest.match(new RegExp(`(?:^|\\s)(${NUMBER_RE})$`));
    if (trailing && quantity != null) {
      unitPrice = parseBrNumber(trailing[1]);
      rest = rest.slice(0, trailing.index).trim();
    }
  }

  const name = emptyToNull(rest) || original;
  return { name, quantity, unit, unitPrice };
}
