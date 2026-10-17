import { describe, expect, it } from "vitest";
import {
  applyTaskMove,
  dropIndexFromY,
  shouldActivateDrag,
} from "@/lib/kanban-dnd";

describe("shouldActivateDrag", () => {
  it("não ativa com movimento abaixo do limiar", () => {
    expect(shouldActivateDrag(0, 0, 7, 0)).toBe(false);
    expect(shouldActivateDrag(10, 10, 14, 14)).toBe(false);
  });

  it("ativa com movimento de 8px ou mais", () => {
    expect(shouldActivateDrag(0, 0, 8, 0)).toBe(true);
    expect(shouldActivateDrag(0, 0, 6, 6)).toBe(true);
  });
});

describe("dropIndexFromY", () => {
  const cards = [
    { top: 100, height: 40 },
    { top: 150, height: 40 },
    { top: 200, height: 40 },
  ];

  it("insere no início quando o ponteiro está acima da primeira metade", () => {
    expect(dropIndexFromY(cards, 110)).toBe(0);
  });

  it("insere entre cards pela metade da altura", () => {
    expect(dropIndexFromY(cards, 160)).toBe(1);
    expect(dropIndexFromY(cards, 210)).toBe(2);
  });

  it("insere no fim quando o ponteiro está abaixo do último card", () => {
    expect(dropIndexFromY(cards, 400)).toBe(3);
  });

  it("aceita coluna vazia", () => {
    expect(dropIndexFromY([], 120)).toBe(0);
  });
});

describe("applyTaskMove", () => {
  const tasks = [
    { id: "a", statusColumnId: "todo", orderInColumn: 0 },
    { id: "b", statusColumnId: "todo", orderInColumn: 1 },
    { id: "c", statusColumnId: "doing", orderInColumn: 0 },
  ];

  it("move para uma coluna vazia", () => {
    const next = applyTaskMove(tasks, "a", "done", 0);
    expect(next.find((task) => task.id === "a")).toMatchObject({
      statusColumnId: "done",
      orderInColumn: 0,
    });
    expect(next.find((task) => task.id === "b")).toMatchObject({
      statusColumnId: "todo",
      orderInColumn: 0,
    });
  });

  it("reordena na mesma coluna", () => {
    const next = applyTaskMove(tasks, "a", "todo", 1);
    const todo = next
      .filter((task) => task.statusColumnId === "todo")
      .sort((a, b) => a.orderInColumn - b.orderInColumn);
    expect(todo.map((task) => task.id)).toEqual(["b", "a"]);
  });

  it("move entre colunas na posição pedida", () => {
    const next = applyTaskMove(tasks, "a", "doing", 0);
    const doing = next
      .filter((task) => task.statusColumnId === "doing")
      .sort((a, b) => a.orderInColumn - b.orderInColumn);
    expect(doing.map((task) => task.id)).toEqual(["a", "c"]);
  });
});
