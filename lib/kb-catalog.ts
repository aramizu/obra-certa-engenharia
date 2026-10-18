/** Catálogo SINAPI/Caixa aproximado para reforma de apartamento (estrutura pronta). Valores ajustáveis. */

export type QtyFrom = "area" | "wall_area" | "ceiling_area" | "length_m" | "points" | "units";

export type CatalogCategory = { id: string; slug: string; name: string; sortOrder: number };
export type CatalogMaterial = {
  id: string;
  slug: string;
  name: string;
  unit: string;
  categoryId: string;
  sinapiCode: string | null;
  notes: string | null;
};
export type CatalogModule = {
  id: string;
  slug: string;
  name: string;
  description: string;
  quantityUnit: string;
  qtyFrom: QtyFrom;
  isDemolition: boolean;
  extraLabel: string | null;
  extraKind: "wall_m" | "points" | "count" | null;
  sortOrder: number;
};
export type CatalogComposition = {
  id: string;
  moduleId: string;
  materialId: string;
  consumption: number;
  wastePct: number;
  sinapiCode: string | null;
};
export type CatalogPackage = {
  id: string;
  slug: string;
  name: string;
  description: string;
  moduleIds: string[];
  defaultPoints?: number;
  defaultWallM?: number;
  defaultCount?: number;
};

const C = {
  cimento: "a1000000-0000-4000-8000-000000000001",
  drywall: "a1000000-0000-4000-8000-000000000002",
  revest: "a1000000-0000-4000-8000-000000000003",
  eletrica: "a1000000-0000-4000-8000-000000000004",
  hidraulica: "a1000000-0000-4000-8000-000000000005",
  tintas: "a1000000-0000-4000-8000-000000000006",
  loucas: "a1000000-0000-4000-8000-000000000007",
  gesso: "a1000000-0000-4000-8000-000000000008",
  imperm: "a1000000-0000-4000-8000-000000000009",
  ferragens: "a1000000-0000-4000-8000-00000000000a",
};

const M = {
  cimento: "a2000000-0000-4000-8000-000000000001",
  areia: "a2000000-0000-4000-8000-000000000002",
  cal: "a2000000-0000-4000-8000-000000000003",
  ac3: "a2000000-0000-4000-8000-000000000004",
  ac2: "a2000000-0000-4000-8000-000000000005",
  rejunte: "a2000000-0000-4000-8000-000000000006",
  placaSt: "a2000000-0000-4000-8000-000000000007",
  montante: "a2000000-0000-4000-8000-000000000008",
  guia: "a2000000-0000-4000-8000-000000000009",
  parafuso: "a2000000-0000-4000-8000-00000000000a",
  massaJuntas: "a2000000-0000-4000-8000-00000000000b",
  porcelanato: "a2000000-0000-4000-8000-00000000000c",
  ceramica: "a2000000-0000-4000-8000-00000000000d",
  rodape: "a2000000-0000-4000-8000-00000000000e",
  caixa42: "a2000000-0000-4000-8000-00000000000f",
  eletroduto: "a2000000-0000-4000-8000-000000000010",
  cabo: "a2000000-0000-4000-8000-000000000011",
  tomada: "a2000000-0000-4000-8000-000000000012",
  tubo: "a2000000-0000-4000-8000-000000000013",
  conexao: "a2000000-0000-4000-8000-000000000014",
  registro: "a2000000-0000-4000-8000-000000000015",
  selador: "a2000000-0000-4000-8000-000000000016",
  tinta: "a2000000-0000-4000-8000-000000000017",
  massaCorrida: "a2000000-0000-4000-8000-000000000018",
  vaso: "a2000000-0000-4000-8000-000000000019",
  cuba: "a2000000-0000-4000-8000-00000000001a",
  torneira: "a2000000-0000-4000-8000-00000000001b",
  ducha: "a2000000-0000-4000-8000-00000000001c",
  placaGesso: "a2000000-0000-4000-8000-00000000001d",
  perfilGesso: "a2000000-0000-4000-8000-00000000001e",
  manta: "a2000000-0000-4000-8000-00000000001f",
  primer: "a2000000-0000-4000-8000-000000000020",
  sacoEntulho: "a2000000-0000-4000-8000-000000000021",
  bloco: "a2000000-0000-4000-8000-000000000022",
};

const U = {
  demolirParede: "a3000000-0000-4000-8000-000000000001",
  removerPiso: "a3000000-0000-4000-8000-000000000002",
  drywall: "a3000000-0000-4000-8000-000000000003",
  alvenaria: "a3000000-0000-4000-8000-000000000004",
  contrapiso: "a3000000-0000-4000-8000-000000000005",
  piso: "a3000000-0000-4000-8000-000000000006",
  revest: "a3000000-0000-4000-8000-000000000007",
  forroGesso: "a3000000-0000-4000-8000-000000000008",
  forroDry: "a3000000-0000-4000-8000-000000000009",
  pinturaParede: "a3000000-0000-4000-8000-00000000000a",
  pinturaTeto: "a3000000-0000-4000-8000-00000000000b",
  eletrico: "a3000000-0000-4000-8000-00000000000c",
  hidraulico: "a3000000-0000-4000-8000-00000000000d",
  loucas: "a3000000-0000-4000-8000-00000000000e",
  imperm: "a3000000-0000-4000-8000-00000000000f",
  sacadaFechar: "a3000000-0000-4000-8000-000000000010",
};

const P = {
  banheiro: "a4000000-0000-4000-8000-000000000001",
  cozinha: "a4000000-0000-4000-8000-000000000002",
  sacada: "a4000000-0000-4000-8000-000000000003",
  parede: "a4000000-0000-4000-8000-000000000004",
  piso: "a4000000-0000-4000-8000-000000000005",
  pintura: "a4000000-0000-4000-8000-000000000006",
};

export const KB_IDS = { C, M, U, P };

export const KB_CATEGORIES: CatalogCategory[] = [
  { id: C.cimento, slug: "cimento-argamassa", name: "Cimento/Argamassa", sortOrder: 1 },
  { id: C.drywall, slug: "drywall", name: "Drywall", sortOrder: 2 },
  { id: C.revest, slug: "revestimentos", name: "Revestimentos", sortOrder: 3 },
  { id: C.eletrica, slug: "eletrica", name: "Elétrica", sortOrder: 4 },
  { id: C.hidraulica, slug: "hidraulica", name: "Hidráulica", sortOrder: 5 },
  { id: C.tintas, slug: "tintas", name: "Tintas", sortOrder: 6 },
  { id: C.loucas, slug: "loucas-metais", name: "Louças e Metais", sortOrder: 7 },
  { id: C.gesso, slug: "gesso", name: "Gesso", sortOrder: 8 },
  { id: C.imperm, slug: "impermeabilizacao", name: "Impermeabilização", sortOrder: 9 },
  { id: C.ferragens, slug: "ferragens", name: "Ferragens", sortOrder: 10 },
];

export const KB_MATERIALS: CatalogMaterial[] = [
  { id: M.cimento, slug: "cimento-cp2-50", name: "Cimento CP-II-32 (saco 50 kg)", unit: "saco", categoryId: C.cimento, sinapiCode: "33136", notes: "Consumo convertido de kg para saco de 50 kg." },
  { id: M.areia, slug: "areia-media", name: "Areia média lavada", unit: "m3", categoryId: C.cimento, sinapiCode: "11057", notes: null },
  { id: M.cal, slug: "cal-hidratada", name: "Cal hidratada (saco 20 kg)", unit: "saco", categoryId: C.cimento, sinapiCode: "11034", notes: null },
  { id: M.ac3, slug: "argamassa-ac3", name: "Argamassa colante AC-III (saco 20 kg)", unit: "saco", categoryId: C.cimento, sinapiCode: "73789", notes: null },
  { id: M.ac2, slug: "argamassa-ac2", name: "Argamassa colante AC-II (saco 20 kg)", unit: "saco", categoryId: C.cimento, sinapiCode: "40440", notes: null },
  { id: M.rejunte, slug: "rejunte-flex", name: "Rejunte flexível", unit: "kg", categoryId: C.cimento, sinapiCode: "73796", notes: null },
  { id: M.placaSt, slug: "chapa-st", name: "Chapa drywall ST 12,5 mm 1,20×2,40 m", unit: "placa", categoryId: C.drywall, sinapiCode: "34451", notes: null },
  { id: M.montante, slug: "perfil-montante-48", name: "Perfil montante 48 mm (barra 3 m)", unit: "un", categoryId: C.drywall, sinapiCode: "34472", notes: null },
  { id: M.guia, slug: "perfil-guia-48", name: "Perfil guia 48 mm (barra 3 m)", unit: "un", categoryId: C.drywall, sinapiCode: "34473", notes: null },
  { id: M.parafuso, slug: "parafuso-drywall", name: "Parafuso ponta agulha 25 mm", unit: "un", categoryId: C.drywall, sinapiCode: "34490", notes: null },
  { id: M.massaJuntas, slug: "massa-juntas", name: "Massa para juntas de gesso cartonado", unit: "kg", categoryId: C.drywall, sinapiCode: "34512", notes: null },
  { id: M.porcelanato, slug: "porcelanato-60", name: "Porcelanato 60×60 cm", unit: "m2", categoryId: C.revest, sinapiCode: "102178", notes: "Peça de referência; escolha a linha no fornecedor." },
  { id: M.ceramica, slug: "ceramica-parede", name: "Cerâmica esmaltada para parede 30×60 cm", unit: "m2", categoryId: C.revest, sinapiCode: "102055", notes: null },
  { id: M.rodape, slug: "rodape-7", name: "Rodapé cerâmico/porcelanato 7 cm", unit: "m", categoryId: C.revest, sinapiCode: null, notes: null },
  { id: M.caixa42, slug: "caixa-4x2", name: "Caixa 4×2 para embutir", unit: "un", categoryId: C.eletrica, sinapiCode: "37501", notes: null },
  { id: M.eletroduto, slug: "eletroduto-20", name: "Eletroduto flexível 20 mm", unit: "m", categoryId: C.eletrica, sinapiCode: "37544", notes: null },
  { id: M.cabo, slug: "cabo-25", name: "Cabo isolado 2,5 mm²", unit: "m", categoryId: C.eletrica, sinapiCode: "37610", notes: null },
  { id: M.tomada, slug: "tomada-10a", name: "Tomada ou interruptor 10 A", unit: "un", categoryId: C.eletrica, sinapiCode: "37702", notes: null },
  { id: M.tubo, slug: "tubo-pvc-25", name: "Tubo PVC/PPR soldável 25 mm", unit: "m", categoryId: C.hidraulica, sinapiCode: "39420", notes: null },
  { id: M.conexao, slug: "conexao-25", name: "Conexão PVC/PPR 25 mm", unit: "un", categoryId: C.hidraulica, sinapiCode: "39455", notes: null },
  { id: M.registro, slug: "registro", name: "Registro de gaveta/pressão 25 mm", unit: "un", categoryId: C.hidraulica, sinapiCode: "39510", notes: null },
  { id: M.selador, slug: "selador-acrilico", name: "Selador acrílico", unit: "l", categoryId: C.tintas, sinapiCode: "88357", notes: null },
  { id: M.tinta, slug: "tinta-pva", name: "Tinta PVA látex", unit: "l", categoryId: C.tintas, sinapiCode: "88412", notes: "Duas demãos." },
  { id: M.massaCorrida, slug: "massa-corrida", name: "Massa corrida PVA", unit: "kg", categoryId: C.tintas, sinapiCode: "88201", notes: null },
  { id: M.vaso, slug: "bacia-vaso", name: "Bacia sanitária convencional", unit: "un", categoryId: C.loucas, sinapiCode: "101820", notes: null },
  { id: M.cuba, slug: "cuba-sobrepor", name: "Cuba de sobrepor / de apoio", unit: "un", categoryId: C.loucas, sinapiCode: "101845", notes: null },
  { id: M.torneira, slug: "torneira-mesa", name: "Torneira de mesa", unit: "un", categoryId: C.loucas, sinapiCode: "101902", notes: null },
  { id: M.ducha, slug: "ducha-chuveiro", name: "Chuveiro ou ducha higiênica", unit: "un", categoryId: C.loucas, sinapiCode: "101930", notes: null },
  { id: M.placaGesso, slug: "placa-gesso-60", name: "Placa de gesso 60×60 cm", unit: "un", categoryId: C.gesso, sinapiCode: "34820", notes: null },
  { id: M.perfilGesso, slug: "perfil-f530", name: "Perfil F530 / tabica para forro", unit: "m", categoryId: C.gesso, sinapiCode: "34844", notes: null },
  { id: M.manta, slug: "manta-asfaltica", name: "Manta asfáltica 3 mm", unit: "m2", categoryId: C.imperm, sinapiCode: "73880", notes: null },
  { id: M.primer, slug: "primer-asfaltico", name: "Primer asfáltico", unit: "l", categoryId: C.imperm, sinapiCode: "73891", notes: null },
  { id: M.sacoEntulho, slug: "saco-entulho", name: "Saco de entulho 50 L", unit: "un", categoryId: C.ferragens, sinapiCode: null, notes: null },
  { id: M.bloco, slug: "bloco-ceramico-9", name: "Bloco cerâmico de vedação 9×19×19 cm", unit: "un", categoryId: C.cimento, sinapiCode: "06287", notes: null },
];

export const KB_MODULES: CatalogModule[] = [
  { id: U.demolirParede, slug: "demolir-parede", name: "Remover parede", description: "Demolição de vedação interna. Informe os metros de parede.", quantityUnit: "m2", qtyFrom: "wall_area", isDemolition: true, extraLabel: "Metros de parede a remover", extraKind: "wall_m", sortOrder: 1 },
  { id: U.removerPiso, slug: "remover-piso", name: "Remover piso/revestimento", description: "Retirada do piso existente da área do cômodo.", quantityUnit: "m2", qtyFrom: "area", isDemolition: true, extraLabel: null, extraKind: null, sortOrder: 2 },
  { id: U.drywall, slug: "drywall-dividir", name: "Drywall (fechar/dividir)", description: "Divisória em chapa ST, duas faces.", quantityUnit: "m", qtyFrom: "length_m", isDemolition: false, extraLabel: "Metros de parede nova", extraKind: "wall_m", sortOrder: 3 },
  { id: U.alvenaria, slug: "alvenaria-vedacao", name: "Alvenaria de vedação", description: "Bloco cerâmico 9 cm com argamassa.", quantityUnit: "m2", qtyFrom: "wall_area", isDemolition: false, extraLabel: "m² extras de parede", extraKind: "wall_m", sortOrder: 4 },
  { id: U.contrapiso, slug: "contrapiso", name: "Contrapiso", description: "Regularização de piso ~3 cm.", quantityUnit: "m2", qtyFrom: "area", isDemolition: false, extraLabel: null, extraKind: null, sortOrder: 5 },
  { id: U.piso, slug: "piso-porcelanato", name: "Piso/porcelanato", description: "Assentamento de porcelanato 60×60.", quantityUnit: "m2", qtyFrom: "area", isDemolition: false, extraLabel: null, extraKind: null, sortOrder: 6 },
  { id: U.revest, slug: "revestimento-parede", name: "Revestimento de parede", description: "Cerâmica em paredes molhadas ou destaque.", quantityUnit: "m2", qtyFrom: "wall_area", isDemolition: false, extraLabel: "m² de parede a revestir (se não for o cômodo inteiro)", extraKind: "wall_m", sortOrder: 7 },
  { id: U.forroGesso, slug: "forro-gesso", name: "Forro de gesso", description: "Forro em placas 60×60.", quantityUnit: "m2", qtyFrom: "ceiling_area", isDemolition: false, extraLabel: null, extraKind: null, sortOrder: 8 },
  { id: U.forroDry, slug: "forro-drywall", name: "Forro de drywall", description: "Forro em chapa ST.", quantityUnit: "m2", qtyFrom: "ceiling_area", isDemolition: false, extraLabel: null, extraKind: null, sortOrder: 9 },
  { id: U.pinturaParede, slug: "pintura-paredes", name: "Pintura de paredes", description: "Selador + PVA em duas demãos.", quantityUnit: "m2", qtyFrom: "wall_area", isDemolition: false, extraLabel: null, extraKind: null, sortOrder: 10 },
  { id: U.pinturaTeto, slug: "pintura-teto", name: "Pintura de teto", description: "Selador + PVA no teto.", quantityUnit: "m2", qtyFrom: "ceiling_area", isDemolition: false, extraLabel: null, extraKind: null, sortOrder: 11 },
  { id: U.eletrico, slug: "pontos-eletricos", name: "Pontos elétricos", description: "Caixa, eletroduto, cabo e tomada/interruptor.", quantityUnit: "un", qtyFrom: "points", isDemolition: false, extraLabel: "Número de pontos", extraKind: "points", sortOrder: 12 },
  { id: U.hidraulico, slug: "pontos-hidraulicos", name: "Pontos hidráulicos", description: "Tubo, conexões e registro por ponto.", quantityUnit: "un", qtyFrom: "points", isDemolition: false, extraLabel: "Número de pontos", extraKind: "points", sortOrder: 13 },
  { id: U.loucas, slug: "loucas-metais", name: "Louças e metais", description: "Conjunto (vaso, cuba, torneira, ducha).", quantityUnit: "un", qtyFrom: "units", isDemolition: false, extraLabel: "Conjuntos", extraKind: "count", sortOrder: 14 },
  { id: U.imperm, slug: "impermeabilizacao", name: "Impermeabilização", description: "Manta e primer (banheiro/sacada).", quantityUnit: "m2", qtyFrom: "area", isDemolition: false, extraLabel: null, extraKind: null, sortOrder: 15 },
  { id: U.sacadaFechar, slug: "sacada-fechar", name: "Fechar sacada", description: "Vedação da sacada (metragem de pele de vidro/alvenaria leve em m² de vão).", quantityUnit: "m2", qtyFrom: "wall_area", isDemolition: false, extraLabel: "m² de vão a fechar", extraKind: "wall_m", sortOrder: 16 },
];

function comp(i: number, moduleId: string, materialId: string, consumption: number, wastePct: number, sinapiCode: string | null = null): CatalogComposition {
  return {
    id: `a5000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    moduleId,
    materialId,
    consumption,
    wastePct,
    sinapiCode,
  };
}

export const KB_COMPOSITIONS: CatalogComposition[] = [
  comp(1, U.demolirParede, M.sacoEntulho, 1.5, 5),
  comp(2, U.removerPiso, M.sacoEntulho, 2, 5),
  comp(3, U.drywall, M.placaSt, 0.72, 8, "34451"),
  comp(4, U.drywall, M.montante, 1.1, 5, "34472"),
  comp(5, U.drywall, M.guia, 0.7, 5, "34473"),
  comp(6, U.drywall, M.parafuso, 28, 10),
  comp(7, U.drywall, M.massaJuntas, 0.9, 10),
  comp(8, U.alvenaria, M.bloco, 26, 5, "06287"),
  comp(9, U.alvenaria, M.cimento, 0.13, 8, "33136"),
  comp(10, U.alvenaria, M.areia, 0.032, 10, "11057"),
  comp(11, U.alvenaria, M.cal, 0.12, 8),
  comp(12, U.contrapiso, M.cimento, 0.24, 10, "33136"),
  comp(13, U.contrapiso, M.areia, 0.04, 10, "11057"),
  comp(14, U.piso, M.porcelanato, 1, 8, "102178"),
  comp(15, U.piso, M.ac3, 0.3, 10, "73789"),
  comp(16, U.piso, M.rejunte, 0.55, 10, "73796"),
  comp(17, U.piso, M.rodape, 1, 8),
  comp(18, U.revest, M.ceramica, 1, 10, "102055"),
  comp(19, U.revest, M.ac2, 0.28, 10, "40440"),
  comp(20, U.revest, M.rejunte, 0.45, 10),
  comp(21, U.forroGesso, M.placaGesso, 2.9, 8, "34820"),
  comp(22, U.forroGesso, M.perfilGesso, 2.4, 8, "34844"),
  comp(23, U.forroDry, M.placaSt, 0.36, 8, "34451"),
  comp(24, U.forroDry, M.montante, 0.55, 5),
  comp(25, U.forroDry, M.parafuso, 16, 10),
  comp(26, U.pinturaParede, M.massaCorrida, 0.35, 10, "88201"),
  comp(27, U.pinturaParede, M.selador, 0.12, 8, "88357"),
  comp(28, U.pinturaParede, M.tinta, 0.24, 8, "88412"),
  comp(29, U.pinturaTeto, M.massaCorrida, 0.3, 10),
  comp(30, U.pinturaTeto, M.selador, 0.1, 8),
  comp(31, U.pinturaTeto, M.tinta, 0.22, 8),
  comp(32, U.eletrico, M.caixa42, 1, 5, "37501"),
  comp(33, U.eletrico, M.eletroduto, 3.5, 10, "37544"),
  comp(34, U.eletrico, M.cabo, 6, 10, "37610"),
  comp(35, U.eletrico, M.tomada, 1, 5, "37702"),
  comp(36, U.hidraulico, M.tubo, 2.5, 10, "39420"),
  comp(37, U.hidraulico, M.conexao, 4, 10, "39455"),
  comp(38, U.hidraulico, M.registro, 0.35, 5, "39510"),
  comp(39, U.loucas, M.vaso, 1, 0, "101820"),
  comp(40, U.loucas, M.cuba, 1, 0, "101845"),
  comp(41, U.loucas, M.torneira, 1, 0, "101902"),
  comp(42, U.loucas, M.ducha, 1, 0, "101930"),
  comp(43, U.imperm, M.manta, 1, 10, "73880"),
  comp(44, U.imperm, M.primer, 0.4, 8, "73891"),
  comp(45, U.sacadaFechar, M.placaSt, 0.4, 8),
  comp(46, U.sacadaFechar, M.montante, 0.8, 5),
];

export const KB_PACKAGES: CatalogPackage[] = [
  { id: P.banheiro, slug: "banheiro-completo", name: "Banheiro completo", description: "Impermeabilização, piso, revestimento, forro, pintura, pontos e louças.", moduleIds: [U.removerPiso, U.contrapiso, U.imperm, U.piso, U.revest, U.forroGesso, U.pinturaParede, U.pinturaTeto, U.eletrico, U.hidraulico, U.loucas], defaultPoints: 8, defaultCount: 1 },
  { id: P.cozinha, slug: "cozinha", name: "Cozinha", description: "Piso, revestimento, pintura e pontos.", moduleIds: [U.contrapiso, U.piso, U.revest, U.pinturaParede, U.pinturaTeto, U.eletrico, U.hidraulico], defaultPoints: 10 },
  { id: P.sacada, slug: "integrar-sacada", name: "Integrar sacada", description: "Remove a parede da sacada, unifica piso e pintura.", moduleIds: [U.demolirParede, U.contrapiso, U.piso, U.pinturaParede, U.pinturaTeto], defaultWallM: 3 },
  { id: P.parede, slug: "remover-parede", name: "Remover parede / integrar ambientes", description: "Demolição da vedação entre cômodos.", moduleIds: [U.demolirParede], defaultWallM: 3 },
  { id: P.piso, slug: "trocar-piso", name: "Trocar piso do apto", description: "Remove piso, contrapiso e porcelanato novo.", moduleIds: [U.removerPiso, U.contrapiso, U.piso] },
  { id: P.pintura, slug: "pintura-geral", name: "Pintura geral", description: "Paredes e teto.", moduleIds: [U.pinturaParede, U.pinturaTeto] },
];

export type KnowledgeCatalog = {
  categories: CatalogCategory[];
  materials: CatalogMaterial[];
  modules: CatalogModule[];
  compositions: CatalogComposition[];
  packages: CatalogPackage[];
};

export const DEFAULT_KNOWLEDGE_CATALOG: KnowledgeCatalog = {
  categories: KB_CATEGORIES,
  materials: KB_MATERIALS,
  modules: KB_MODULES,
  compositions: KB_COMPOSITIONS,
  packages: KB_PACKAGES,
};
