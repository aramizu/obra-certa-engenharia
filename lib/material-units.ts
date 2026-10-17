export const MATERIAL_UNITS = [
  { value: "un", label: "Unidade", showQuantityPerUnit: false },
  { value: "kg", label: "Quilograma (kg)", showQuantityPerUnit: false },
  { value: "g", label: "Grama (g)", showQuantityPerUnit: false },
  { value: "t", label: "Tonelada (t)", showQuantityPerUnit: false },
  { value: "m", label: "Metro (m)", showQuantityPerUnit: false },
  { value: "m2", label: "Metro Quadrado (m²)", showQuantityPerUnit: false },
  { value: "m3", label: "Metro Cúbico (m³)", showQuantityPerUnit: false },
  { value: "l", label: "Litro (L)", showQuantityPerUnit: false },
  { value: "saco", label: "Saco", showQuantityPerUnit: true, defaultQuantity: "50" },
  { value: "caixa", label: "Caixa", showQuantityPerUnit: true, defaultQuantity: "100" },
  { value: "pacote", label: "Pacote", showQuantityPerUnit: true, defaultQuantity: "1" },
  { value: "barra", label: "Barra", showQuantityPerUnit: true, defaultQuantity: "12" },
  { value: "lata", label: "Lata", showQuantityPerUnit: true, defaultQuantity: "3.6" },
  { value: "galao", label: "Galão", showQuantityPerUnit: true, defaultQuantity: "18" },
  { value: "balde", label: "Balde", showQuantityPerUnit: true, defaultQuantity: "18" },
  { value: "milheiro", label: "Milheiro", showQuantityPerUnit: true, defaultQuantity: "1000" },
  { value: "rolo", label: "Rolo", showQuantityPerUnit: true, defaultQuantity: "1" },
  { value: "placa", label: "Placa", showQuantityPerUnit: false },
  { value: "peça", label: "Peça", showQuantityPerUnit: false },
] as const;

export function getUnitLabel(value: string): string {
  const unit = MATERIAL_UNITS.find(u => u.value === value);
  return unit?.label || value;
}

export function shouldShowQuantityPerUnit(value: string): boolean {
  const unit = MATERIAL_UNITS.find(u => u.value === value);
  return unit?.showQuantityPerUnit || false;
}

export function getDefaultQuantity(value: string): string {
  const unit = MATERIAL_UNITS.find(u => u.value === value);
  return unit && 'defaultQuantity' in unit ? unit.defaultQuantity : "1";
}
