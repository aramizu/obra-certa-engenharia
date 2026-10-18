import { KB_MATERIALS, KB_IDS } from "@/lib/kb-catalog";

export type TemplateItemDraft = {
  name: string;
  quantity: string | null;
  unit: string | null;
  unitPrice: string | null;
  groupName: string | null;
  notes: string | null;
  kbRefId: string | null;
  kbRefCode: string | null;
  refUnit: string | null;
  refUnitPrice: string | null;
};

export type ObraPreset = {
  key: string;
  name: string;
  description: string;
  items: TemplateItemDraft[];
};

function kb(id: string, groupName: string, extra?: Partial<TemplateItemDraft>): TemplateItemDraft {
  const material = KB_MATERIALS.find((row) => row.id === id);
  if (!material) {
    return {
      name: extra?.name || "Item",
      quantity: extra?.quantity ?? null,
      unit: extra?.unit ?? null,
      unitPrice: null,
      groupName,
      notes: extra?.notes ?? null,
      kbRefId: null,
      kbRefCode: null,
      refUnit: null,
      refUnitPrice: null,
    };
  }
  return {
    name: extra?.name || material.name,
    quantity: extra?.quantity ?? null,
    unit: extra?.unit ?? material.unit,
    unitPrice: extra?.unitPrice ?? null,
    groupName,
    notes: extra?.notes ?? null,
    kbRefId: null,
    kbRefCode: null,
    refUnit: null,
    refUnitPrice: null,
  };
}

const M = KB_IDS.M;

export const OBRA_PRESETS: ObraPreset[] = [
  {
    key: "blank",
    name: "Em branco",
    description: "Começa sem itens — cadastre o que for surgindo.",
    items: [],
  },
  {
    key: "piso",
    name: "Troca de piso",
    description: "Remoção, contrapiso e piso novo.",
    items: [
      kb(M.sacoEntulho, "Piso", { name: "Saco de entulho (remoção do piso)" }),
      kb(M.cimento, "Piso"),
      kb(M.areia, "Piso"),
      kb(M.porcelanato, "Piso", { name: "Piso vinílico / porcelanato" }),
      kb(M.ac3, "Piso"),
      kb(M.rejunte, "Piso"),
      kb(M.rodape, "Piso"),
    ],
  },
  {
    key: "drywall",
    name: "Parede de drywall",
    description: "Divisória em chapa ST.",
    items: [
      kb(M.placaSt, "Drywall"),
      kb(M.montante, "Drywall"),
      kb(M.guia, "Drywall"),
      kb(M.parafuso, "Drywall"),
      kb(M.massaJuntas, "Drywall"),
    ],
  },
  {
    key: "sacada",
    name: "Abrir sacada",
    description: "Demolição da vedação, piso e pintura.",
    items: [
      kb(M.sacoEntulho, "Sacada", { name: "Saco de entulho (demolição)" }),
      kb(M.cimento, "Sacada"),
      kb(M.areia, "Sacada"),
      kb(M.porcelanato, "Sacada"),
      kb(M.selador, "Sacada"),
      kb(M.tinta, "Sacada"),
    ],
  },
];

export function getObraPreset(key: string | null | undefined) {
  if (!key || key === "blank") return OBRA_PRESETS[0];
  return OBRA_PRESETS.find((preset) => preset.key === key) ?? null;
}
