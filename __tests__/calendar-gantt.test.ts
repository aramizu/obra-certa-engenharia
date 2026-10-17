import { describe, expect, it } from "vitest";
import {
  BADGE_CLASS,
  GANTT_BAR_CLASS,
  GANTT_MILESTONE_CLASS,
  WEEKDAY_LABELS,
  formatGanttDateRange,
  ganttLabelFitsInside,
  isWeekend,
  taskBadgeTone,
} from "@/lib/calendar";

describe("Gantt calendar helpers", () => {
  it("reusa os rótulos de weekday do calendário", () => {
    expect(WEEKDAY_LABELS).toEqual(["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]);
  });

  it("marca fim de semana", () => {
    expect(isWeekend(new Date(2026, 9, 17))).toBe(true);
    expect(isWeekend(new Date(2026, 9, 16))).toBe(false);
  });

  it("coloca o nome dentro da barra só quando ela é larga o suficiente", () => {
    expect(ganttLabelFitsInside(79)).toBe(false);
    expect(ganttLabelFitsInside(80)).toBe(true);
  });

  it("formata intervalo em pt-BR", () => {
    const start = new Date(2026, 9, 10);
    const end = new Date(2026, 9, 12);
    expect(formatGanttDateRange(start, end)).toMatch(/10.*12/);
    expect(formatGanttDateRange(start, end, true)).toBe(start.toLocaleDateString("pt-BR"));
  });

  it("usa as mesmas cores de badge do calendário (identidade Obra Certa)", () => {
    for (const tone of Object.keys(GANTT_BAR_CLASS) as Array<keyof typeof GANTT_BAR_CLASS>) {
      expect(GANTT_BAR_CLASS[tone]).toBeTruthy();
      expect(GANTT_MILESTONE_CLASS[tone]).toBeTruthy();
    }
    expect(GANTT_BAR_CLASS.high).toContain("bg-delay-wash");
    expect(GANTT_BAR_CLASS.medium).toContain("bg-signal-wash");
    expect(GANTT_BAR_CLASS.low).toContain("bg-blueprint-wash");
    expect(GANTT_BAR_CLASS.milestone).toContain("bg-primary");
    expect(GANTT_BAR_CLASS.overdue).toContain("bg-delay");
    expect(GANTT_BAR_CLASS.overdue).toContain("text-delay-ink");
    expect(GANTT_BAR_CLASS.done).toContain("bg-done-wash");
    expect(GANTT_BAR_CLASS.high).toEqual(expect.stringContaining("border-delay"));
    expect(GANTT_BAR_CLASS.high).toContain("rounded-full");
    expect(BADGE_CLASS.high).toContain("rounded-full");
  });

  it("deriva tom de atraso e concluída a partir da coluna", () => {
    const task = { taskType: "high", isMilestone: false, dueDate: "2020-01-01", endDate: null };
    expect(taskBadgeTone(task, "A Fazer", "2026-10-17")).toBe("overdue");
    expect(taskBadgeTone(task, "Concluído", "2026-10-17")).toBe("done");
    expect(taskBadgeTone({ ...task, dueDate: "2026-12-01" }, "A Fazer", "2026-10-17")).toBe("high");
  });
});
