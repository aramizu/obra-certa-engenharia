import { describe, expect, it } from "vitest";
import { isWeekOrOverdueTask, relativeDueChip } from "@/lib/calendar";
import { endOfWeekSunday, formatISODate, startOfWeekMonday } from "@/lib/date";

describe("semana corrente (seg–dom)", () => {
  it("abre na segunda e fecha no domingo", () => {
    const sunday = new Date(2026, 9, 18);
    const monday = new Date(2026, 9, 12);
    const saturday = new Date(2026, 9, 17);

    expect(formatISODate(startOfWeekMonday(sunday))).toBe("2026-10-12");
    expect(formatISODate(startOfWeekMonday(monday))).toBe("2026-10-12");
    expect(formatISODate(startOfWeekMonday(saturday))).toBe("2026-10-12");
    expect(formatISODate(endOfWeekSunday(sunday))).toBe("2026-10-18");
    expect(formatISODate(endOfWeekSunday(new Date(2026, 9, 19)))).toBe("2026-10-25");
  });
});

describe("relativeDueChip", () => {
  const today = "2026-10-18";

  it("descreve prazo futuro, hoje e atraso", () => {
    expect(relativeDueChip("2026-10-21", today)).toEqual({ label: "Vence em 3 dias", fill: "concrete" });
    expect(relativeDueChip("2026-10-19", today)).toEqual({ label: "Vence amanhã", fill: "concrete" });
    expect(relativeDueChip("2026-10-18", today)).toEqual({ label: "Vence hoje", fill: "signal" });
    expect(relativeDueChip("2026-10-17", today)).toEqual({ label: "Vencida há 1 dia", fill: "delay" });
    expect(relativeDueChip("2026-10-15", today)).toEqual({ label: "Vencida há 3 dias", fill: "delay" });
  });
});

describe("isWeekOrOverdueTask", () => {
  const weekEnd = "2026-10-18";

  it("inclui atrasadas e a semana, exclui concluídas e o que vence depois", () => {
    expect(isWeekOrOverdueTask({ dueDate: "2026-10-10", endDate: null }, "A fazer", weekEnd)).toBe(true);
    expect(isWeekOrOverdueTask({ dueDate: "2026-10-18", endDate: null }, "Em andamento", weekEnd)).toBe(true);
    expect(isWeekOrOverdueTask({ dueDate: "2026-10-19", endDate: null }, "A fazer", weekEnd)).toBe(false);
    expect(isWeekOrOverdueTask({ dueDate: "2026-10-10", endDate: null }, "Concluído", weekEnd)).toBe(false);
    expect(isWeekOrOverdueTask({ dueDate: null, endDate: null }, "A fazer", weekEnd)).toBe(false);
  });
});
