export const NOTE_COLOR_IDS = [
  "yellow",
  "peach",
  "pink",
  "mint",
  "sky",
  "lilac",
  "butter",
  "sage",
] as const;

export type NoteColorId = (typeof NOTE_COLOR_IDS)[number];

export const DEFAULT_NOTE_COLOR: NoteColorId = "yellow";

export const NOTE_COLORS: { id: NoteColorId; label: string; paper: string }[] = [
  { id: "yellow", label: "Amarelo", paper: "bg-[hsl(48_92%_70%)]" },
  { id: "peach", label: "Pêssego", paper: "bg-[hsl(22_88%_78%)]" },
  { id: "pink", label: "Rosa", paper: "bg-[hsl(340_62%_82%)]" },
  { id: "mint", label: "Menta", paper: "bg-[hsl(152_36%_78%)]" },
  { id: "sky", label: "Céu", paper: "bg-[hsl(210_52%_80%)]" },
  { id: "lilac", label: "Lilás", paper: "bg-[hsl(270_38%_82%)]" },
  { id: "butter", label: "Manteiga", paper: "bg-[hsl(46_100%_76%)]" },
  { id: "sage", label: "Sálvia", paper: "bg-[hsl(110_22%_78%)]" },
];

export function isNoteColorId(value: unknown): value is NoteColorId {
  return typeof value === "string" && (NOTE_COLOR_IDS as readonly string[]).includes(value);
}

export function resolveNoteColorId(color: string | null | undefined): NoteColorId {
  return isNoteColorId(color) ? color : DEFAULT_NOTE_COLOR;
}

export function notePaperClass(color: string | null | undefined) {
  const id = resolveNoteColorId(color);
  return NOTE_COLORS.find((item) => item.id === id)!.paper;
}

/** Rotação leve e estável a partir do id (−2.4° a 2.4°). */
export function noteRotationDeg(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return ((Math.abs(hash) % 11) - 5) * 0.48;
}

export type SortableNote = { id: string; position: number };

export function applyNoteMove<T extends SortableNote>(notes: T[], noteId: string, index: number): T[] {
  const sorted = [...notes].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const from = sorted.findIndex((note) => note.id === noteId);
  if (from < 0) return notes;
  const [item] = sorted.splice(from, 1);
  const to = Math.max(0, Math.min(index, sorted.length));
  sorted.splice(to, 0, item);
  return sorted.map((note, position) => ({ ...note, position }));
}

export function dropIndexFromPoint(
  rects: Array<{ id: string; left: number; top: number; width: number; height: number }>,
  x: number,
  y: number,
  draggedId: string
) {
  const others = rects.filter((rect) => rect.id !== draggedId);
  if (others.length === 0) return 0;
  let best = 0;
  let bestDist = Infinity;
  others.forEach((rect, index) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = (x - cx) ** 2 + (y - cy) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = index;
    }
  });
  const hit = others[best];
  const after = x > hit.left + hit.width / 2 || y > hit.top + hit.height / 2;
  return after ? best + 1 : best;
}
