import { describe, expect, it } from "vitest";
import {
  formatGanttHeaderBottom,
  formatGanttHeaderTop,
  ganttBarColumnSpan,
  ganttColumns,
  shiftGanttCursor,
} from "@/lib/gantt-header";

describe("rótulos do cabeçalho do Gantt", () => {
  it("visão mês: linha de cima = mês e ano; linha de baixo = DD-Dia", () => {
    const oct = new Date(2026, 9, 17);
    const columns = ganttColumns("month", oct);
    expect(columns).toHaveLength(31);
    expect(formatGanttHeaderTop("month", columns[0].date, columns.at(-1)!.date)).toBe("Outubro 2026");
    expect(formatGanttHeaderBottom("month", columns[0].date)).toBe("01-Qui");
    expect(formatGanttHeaderBottom("month", new Date(2026, 9, 17))).toBe("17-Sáb");
    expect(formatGanttHeaderBottom("month", columns.at(-1)!.date)).toBe("31-Sáb");
  });

  it("visão semana no mesmo mês: Mês (início-fim) ano", () => {
    expect(formatGanttHeaderTop("week", new Date(2026, 9, 1), new Date(2026, 9, 7))).toBe(
      "Outubro (01-07) 2026"
    );
  });

  it("visão semana cruzando meses: Out (29) - Nov (04) 2026", () => {
    expect(formatGanttHeaderTop("week", new Date(2026, 9, 29), new Date(2026, 10, 4))).toBe(
      "Out (29) - Nov (04) 2026"
    );
  });

  it("visão semana: 7 dias com números de 2 dígitos na linha de baixo", () => {
    const columns = ganttColumns("week", new Date(2026, 9, 17));
    expect(columns).toHaveLength(7);
    expect(columns.map((column) => formatGanttHeaderBottom("week", column.date))).toEqual([
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
    ]);
    expect(formatGanttHeaderTop("week", columns[0].date, columns.at(-1)!.date)).toBe(
      "Outubro (11-17) 2026"
    );
  });

  it("visão dia: linha de cima = dd/mm/yyyy; linha de baixo = 00..23", () => {
    const day = new Date(2026, 9, 17);
    const columns = ganttColumns("day", day);
    expect(columns).toHaveLength(24);
    expect(formatGanttHeaderTop("day", day)).toBe("17/10/2026");
    expect(columns.map((column) => formatGanttHeaderBottom("day", column.date, column.hour))).toEqual(
      Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"))
    );
  });

  it("semana que cruza o ano inclui os dois anos", () => {
    expect(formatGanttHeaderTop("week", new Date(2026, 11, 27), new Date(2027, 0, 2))).toBe(
      "Dez (27) 2026 - Jan (02) 2027"
    );
  });
});

describe("colunas e barras alinhadas ao cabeçalho", () => {
  it("a barra ocupa do início ao fim inclusive, alinhada às colunas do mês", () => {
    const columns = ganttColumns("month", new Date(2026, 9, 1));
    expect(ganttBarColumnSpan("month", columns, new Date(2026, 9, 2), new Date(2026, 9, 4))).toEqual({
      startIndex: 1,
      endIndex: 3,
    });
  });

  it("recorta a barra nas bordas da janela visível", () => {
    const columns = ganttColumns("month", new Date(2026, 9, 1));
    expect(ganttBarColumnSpan("month", columns, new Date(2026, 8, 28), new Date(2026, 9, 2))).toEqual({
      startIndex: 0,
      endIndex: 1,
    });
    expect(ganttBarColumnSpan("month", columns, new Date(2026, 10, 1), new Date(2026, 10, 5))).toBeNull();
  });

  it("visão dia: tarefa que cai no dia ocupa as 24 horas", () => {
    const columns = ganttColumns("day", new Date(2026, 9, 17));
    expect(ganttBarColumnSpan("day", columns, new Date(2026, 9, 16), new Date(2026, 9, 18))).toEqual({
      startIndex: 0,
      endIndex: 23,
    });
    expect(ganttBarColumnSpan("day", columns, new Date(2026, 9, 18), new Date(2026, 9, 20))).toBeNull();
  });

  it("navega cursor por mês, semana e dia", () => {
    const cursor = new Date(2026, 9, 17);
    expect(shiftGanttCursor(cursor, "month", 1)).toEqual(new Date(2026, 10, 1));
    expect(shiftGanttCursor(cursor, "week", -1)).toEqual(new Date(2026, 9, 10));
    expect(shiftGanttCursor(cursor, "day", 1)).toEqual(new Date(2026, 9, 18));
  });
});
