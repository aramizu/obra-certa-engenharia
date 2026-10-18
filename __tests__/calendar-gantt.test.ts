import { describe, expect, it } from "vitest";
import {
  BADGE_CLASS,
  BADGE_FILL,
  GANTT_BAR_CLASS,
  WEEKDAY_LABELS,
  formatGanttDateRange,
  ganttLabelFitsInside,
  isWeekend,
  taskBadgeTone,
} from "@/lib/calendar";
import { TASK_CHIP_CLASS } from "@/components/ds/chip";

describe("Gantt calendar helpers", () => {
  it("reusa os rótulos de weekday do calendário", () => {
    expect(WEEKDAY_LABELS).toEqual(["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]);
  });

  it("marca fim de semana", () => {
    expect(isWeekend(new Date(2026, 9, 17))).toBe(true);
    expect(isWeekend(new Date(2026, 9, 16))).toBe(false);
  });

  it("coloca o nome dentro da barra só quando ela é larga o suficiente", () => {
    expect(ganttLabelFitsInside(71)).toBe(false);
    expect(ganttLabelFitsInside(72)).toBe(true);
  });

  it("formata intervalo em pt-BR", () => {
    const start = new Date(2026, 9, 10);
    const end = new Date(2026, 9, 12);
    expect(formatGanttDateRange(start, end)).toMatch(/10.*12/);
    expect(formatGanttDateRange(start, start)).toBe(start.toLocaleDateString("pt-BR"));
  });

  it("usa as mesmas cores de badge do calendário (identidade Obra Certa)", () => {
    for (const tone of Object.keys(GANTT_BAR_CLASS) as Array<keyof typeof GANTT_BAR_CLASS>) {
      expect(GANTT_BAR_CLASS[tone]).toContain("ds-chip-surface");
      expect(GANTT_BAR_CLASS[tone]).toContain("ds-chip");
      expect(GANTT_BAR_CLASS[tone]).not.toContain("ds-chip-pill");
      expect(GANTT_BAR_CLASS[tone]).not.toContain("border-graphite");
      expect(GANTT_BAR_CLASS[tone]).not.toContain("rounded-full");
    }
    expect(GANTT_BAR_CLASS.high).toBe(TASK_CHIP_CLASS);
    expect(BADGE_CLASS.high).toContain("ds-chip-pill");
    expect(BADGE_FILL.high).toBe("delay-wash");
    expect(Object.keys(GANTT_BAR_CLASS)).not.toContain("milestone");
  });

  it("deriva tom de atraso e concluída a partir da coluna", () => {
    const task = { taskType: "high", dueDate: "2020-01-01", endDate: null };
    expect(taskBadgeTone(task, "A Fazer", "2026-10-17")).toBe("overdue");
    expect(taskBadgeTone(task, "Concluído", "2026-10-17")).toBe("done");
    expect(taskBadgeTone({ ...task, dueDate: "2026-12-01" }, "A Fazer", "2026-10-17")).toBe("high");
  });
});
