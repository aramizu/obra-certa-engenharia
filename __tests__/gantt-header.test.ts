import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  GANTT_BAR_INSET_PX,
  formatGanttHeaderBottom,
  formatGanttHeaderTop,
  ganttBarBoxStyle,
  ganttBarColumnSpan,
  ganttClockHourToColumn,
  ganttColumns,
  ganttNowLineOffset,
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

  it("visão semana: 7 dias no formato DD-Dia, igual ao mês", () => {
    const columns = ganttColumns("week", new Date(2026, 9, 17));
    expect(columns).toHaveLength(7);
    expect(columns.map((column) => formatGanttHeaderBottom("week", column.date))).toEqual([
      "11-Dom",
      "12-Seg",
      "13-Ter",
      "14-Qua",
      "15-Qui",
      "16-Sex",
      "17-Sáb",
    ]);
    expect(formatGanttHeaderTop("week", columns[0].date, columns.at(-1)!.date)).toBe(
      "Outubro (11-17) 2026"
    );
  });

  it("visão dia: linha de cima = dd/mm/yyyy; linha de baixo = 1h..24h", () => {
    const day = new Date(2026, 9, 17);
    const columns = ganttColumns("day", day);
    expect(columns).toHaveLength(24);
    expect(columns[0].hour).toBe(1);
    expect(columns.at(-1)!.hour).toBe(24);
    expect(formatGanttHeaderTop("day", day)).toBe("17/10/2026");
    expect(columns.map((column) => formatGanttHeaderBottom("day", column.date, column.hour))).toEqual(
      Array.from({ length: 24 }, (_, index) => `${index + 1}h`)
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

  it("mapeia meia-noite do relógio para a coluna 24h", () => {
    expect(ganttClockHourToColumn(0)).toBe(24);
    expect(ganttClockHourToColumn(1)).toBe(1);
    expect(ganttClockHourToColumn(14)).toBe(14);
    expect(ganttClockHourToColumn(23)).toBe(23);
  });

  it("navega cursor por mês, semana e dia", () => {
    const cursor = new Date(2026, 9, 17);
    expect(shiftGanttCursor(cursor, "month", 1)).toEqual(new Date(2026, 10, 1));
    expect(shiftGanttCursor(cursor, "week", -1)).toEqual(new Date(2026, 9, 10));
    expect(shiftGanttCursor(cursor, "day", 1)).toEqual(new Date(2026, 9, 18));
  });

  it("linha do agora: no dia, no minuto da coluna da hora; na semana/mês, na hora do dia", () => {
    const day = ganttColumns("day", new Date(2026, 9, 17));
    expect(ganttNowLineOffset("day", day, new Date(2026, 9, 17, 14, 0))).toEqual({ index: 13, progress: 0 });
    expect(ganttNowLineOffset("day", day, new Date(2026, 9, 17, 14, 30))).toEqual({ index: 13, progress: 0.5 });
    expect(ganttNowLineOffset("day", day, new Date(2026, 9, 17, 0, 15))).toEqual({ index: 23, progress: 0.25 });
    expect(ganttNowLineOffset("day", day, new Date(2026, 9, 18, 14, 0))).toBeNull();

    const week = ganttColumns("week", new Date(2026, 9, 17));
    expect(ganttNowLineOffset("week", week, new Date(2026, 9, 17, 12, 0))).toEqual({ index: 6, progress: 0.5 });
    expect(ganttNowLineOffset("week", week, new Date(2026, 9, 16, 6, 0))?.index).toBe(5);
    expect(ganttNowLineOffset("week", week, new Date(2026, 9, 16, 6, 0))?.progress).toBeCloseTo(6 / 24);

    const month = ganttColumns("month", new Date(2026, 9, 1));
    expect(ganttNowLineOffset("month", month, new Date(2026, 9, 1, 18, 0))).toEqual({ index: 0, progress: 0.75 });
  });

  it("recua a pílula 4px de cada lado, inclusive na primeira, na última e em 1 coluna", () => {
    expect(GANTT_BAR_INSET_PX).toBe(4);
    const first = ganttBarBoxStyle(0, 1, 7);
    expect(first.left).toBe("calc(0% + 4px)");
    expect(first.width).toMatch(/^calc\(.+% - 8px\)$/);
    const last = ganttBarBoxStyle(23, 1, 24);
    expect(last.left).toMatch(/^calc\(.+% \+ 4px\)$/);
    expect(last.width).toMatch(/^calc\(.+% - 8px\)$/);
    expect(ganttBarBoxStyle(0, 24, 24)).toEqual({
      left: "calc(0% + 4px)",
      width: "calc(100% - 8px)",
    });
  });
});

describe("regras visuais do Gantt", () => {
  it("não pinta hoje/fim de semana no corpo, trunca o título na barra e deixa fora da visão vazio", () => {
    const chart = readFileSync(new URL("../app/(app)/gantt/[id]/gantt-chart.tsx", import.meta.url), "utf8");
    expect(chart).not.toContain("bg-signal-wash");
    expect(chart).not.toContain("isWeekend");
    expect(chart).not.toContain("showOutsideLabel");
    expect(chart).not.toContain("Fora desta visão");
    expect(chart).toContain("truncate");
    expect(chart).toContain("Sem datas — toque para definir");
    expect(chart).toContain("ganttNowLineOffset");
    expect(chart).toContain("md:sticky md:left-0");
    expect(chart).not.toContain("sticky left-0");
    expect(chart).toContain("[--gantt-label-w:132px]");
    expect(chart).toContain("md:[--gantt-label-w:220px]");
    expect(chart).toContain("GROUP_H = 28");
    expect(chart).toContain("bg-graphite text-white");
  });
});
