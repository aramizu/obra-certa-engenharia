import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTE_COLOR,
  NOTE_COLOR_IDS,
  applyNoteMove,
  dropIndexFromPoint,
  noteRotationDeg,
  resolveNoteColorId,
} from "@/lib/notes";

describe("post-its", () => {
  it("tem paleta de papel e padrão amarelo", () => {
    expect(NOTE_COLOR_IDS.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_NOTE_COLOR).toBe("yellow");
    expect(resolveNoteColorId(null)).toBe("yellow");
    expect(resolveNoteColorId("mint")).toBe("mint");
  });

  it("rotação é estável por id e pequena", () => {
    expect(noteRotationDeg("abc")).toBe(noteRotationDeg("abc"));
    expect(Math.abs(noteRotationDeg("abc"))).toBeLessThanOrEqual(2.5);
    expect(noteRotationDeg("abc")).not.toBe(noteRotationDeg("xyz"));
  });

  it("reordena pela posição e aceita soltar o último", () => {
    const notes = [
      { id: "a", position: 0 },
      { id: "b", position: 1 },
      { id: "c", position: 2 },
    ];
    expect(applyNoteMove(notes, "a", 2).map((note) => note.id)).toEqual(["b", "c", "a"]);
    expect(applyNoteMove(notes, "c", 0).map((note) => note.id)).toEqual(["c", "a", "b"]);
  });

  it("calcula índice de drop pela metade do card", () => {
    const rects = [
      { id: "a", left: 0, top: 0, width: 100, height: 80 },
      { id: "b", left: 120, top: 0, width: 100, height: 80 },
    ];
    expect(dropIndexFromPoint(rects, 10, 10, "c")).toBe(0);
    expect(dropIndexFromPoint(rects, 180, 10, "a")).toBe(1);
  });
});
