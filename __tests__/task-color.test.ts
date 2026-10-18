import { describe, expect, it } from "vitest";
import { TABS_GROUP_CLASS, TABS_TAB_CLASS } from "@/components/ds/tabs";
import { TASK_CHIP_CLASS } from "@/components/ds/chip";
import {
  DEFAULT_TASK_COLOR,
  TASK_COLOR_IDS,
  parseTaskColorInput,
  resolveTaskColorId,
  taskColorStyle,
} from "@/lib/task-color";

describe("cor da tarefa", () => {
  it("oferece paleta do design system com padrão segurança", () => {
    expect(TASK_COLOR_IDS).toHaveLength(9);
    expect(DEFAULT_TASK_COLOR).toBe("safety");
    expect(resolveTaskColorId(null)).toBe("safety");
    expect(resolveTaskColorId("nope")).toBe("safety");
    expect(resolveTaskColorId("blueprint")).toBe("blueprint");
  });

  it("barra e chip compartilham o raio de Minhas tarefas e o fill contrastado", () => {
    const safety = taskColorStyle("safety");
    expect(safety.bar).toBe(TASK_CHIP_CLASS);
    expect(safety.chip).toBe(TASK_CHIP_CLASS);
    expect(safety.fill).toBe("primary-wash");
    expect(taskColorStyle("signal").fill).toBe("signal-wash");
    expect(taskColorStyle(null).accent).toBe("bg-primary");
    expect(TASK_CHIP_CLASS).not.toContain("rounded-full");
  });

  it("create usa o padrão; patch ignora ausente e rejeita inválida", () => {
    expect(parseTaskColorInput(undefined, "create")).toBe("safety");
    expect(parseTaskColorInput("", "create")).toBe("safety");
    expect(parseTaskColorInput(undefined, "patch")).toBeUndefined();
    expect(parseTaskColorInput("signal", "patch")).toBe("signal");
    expect(parseTaskColorInput("rosa", "patch")).toBeNull();
  });
});

describe("segmented control", () => {
  it("grupo tem padding interno e gap; raio interno menor que o externo", () => {
    expect(TABS_GROUP_CLASS).toContain("p-1");
    expect(TABS_GROUP_CLASS).toContain("gap-1");
    expect(TABS_GROUP_CLASS).toContain("rounded-lg");
    expect(TABS_TAB_CLASS).toContain("rounded-md");
  });
});
