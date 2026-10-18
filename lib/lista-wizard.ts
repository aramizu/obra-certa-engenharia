export const ROOM_SHORTCUTS = [
  "Sala",
  "Cozinha",
  "Banheiro",
  "Quarto",
  "Sacada",
  "Área de serviço",
] as const;

export type RoomDraft = {
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

export function emptyRoom(name = ""): RoomDraft {
  return {
    key: crypto.randomUUID(),
    name,
    areaM2: 0,
    widthM: null,
    lengthM: null,
    perimeterM: null,
    ceilingHeightM: 2.7,
    doors: 0,
    windows: 0,
    moduleIds: [],
    packageIds: [],
    extras: {},
  };
}

export function isValidRoom(room: { name: string }): boolean {
  return room.name.trim().length > 0;
}

export function hasValidRoom(rooms: { name: string }[]): boolean {
  return rooms.some(isValidRoom);
}

export function initialWizardRooms<T>(saved: T[]): T[] {
  return saved.length ? saved : [];
}

export function roomsContinueHint(rooms: { name: string }[]): string | null {
  if (rooms.length === 0) {
    return "Adicione pelo menos um cômodo para continuar.";
  }
  if (!hasValidRoom(rooms)) {
    return "Informe o nome de pelo menos um cômodo para continuar.";
  }
  return null;
}

export function canAdvanceRoomsStep(rooms: { name: string }[]): boolean {
  return hasValidRoom(rooms);
}
