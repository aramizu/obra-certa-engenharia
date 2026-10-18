import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TASK_CHIP_CLASS } from "@/components/ds/chip";
import { PRIORITY_FILL, PRIORITY_LABELS, priorityChip } from "@/lib/task-priority";
import {
  OBRA_FILTER_ALL,
  OBRA_FILTER_NONE,
  SEM_OBRA_LABEL,
  obraChipLabel,
  obraLabel,
  parseObraFilter,
} from "@/lib/user-tasks";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

describe("filtro de obra", () => {
  it("normaliza Todas / Sem obra / uuid", () => {
    expect(parseObraFilter(undefined)).toBe(OBRA_FILTER_ALL);
    expect(parseObraFilter("todas")).toBe(OBRA_FILTER_ALL);
    expect(parseObraFilter("none")).toBe(OBRA_FILTER_NONE);
    expect(parseObraFilter("sem")).toBe(OBRA_FILTER_NONE);
    expect(parseObraFilter("abc-uuid")).toBe("abc-uuid");
    expect(obraLabel(null)).toBe(SEM_OBRA_LABEL);
    expect(obraLabel("Casa Harmonia")).toBe("Casa Harmonia");
    expect(obraChipLabel(null)).toBeNull();
    expect(obraChipLabel("")).toBeNull();
    expect(obraChipLabel("Casa Harmonia")).toBe("Casa Harmonia");
  });

  it("ticket sem obra não leva tag Sem obra; filtro mantém o rótulo e o Gantt usa Outras atividades", () => {
    const card = source("app/(app)/kanban/[id]/task-card.tsx");
    const dashboard = source("app/(app)/dashboard-view.tsx");
    const calendar = source("app/(app)/calendario/calendar-view.tsx");
    const gantt = source("app/(app)/gantt/[id]/gantt-chart.tsx");
    const filter = source("components/obra-filter-bar.tsx");
    const dialog = source("components/task-dialog.tsx");
    expect(card).toContain("obraChipLabel");
    expect(card).not.toContain("obraLabel");
    expect(card).not.toContain(SEM_OBRA_LABEL);
    expect(dashboard).not.toContain("obraLabel");
    expect(calendar).not.toContain("obraLabel");
    expect(gantt).toContain("Outras atividades");
    expect(gantt).not.toContain("name: SEM_OBRA_LABEL");
    expect(filter).toContain("label: SEM_OBRA_LABEL");
    expect(dialog).toContain(`<option value="">{SEM_OBRA_LABEL}</option>`);
  });
});

describe("kanban único por usuário", () => {
  it("migration 0011 adiciona user_id, unifica colunas e deixa project_id nullable", () => {
    const sql = source("migrations/0011_user_kanban.sql");
    expect(sql).toContain('ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "user_id" uuid');
    expect(sql).toContain('ALTER TABLE "task_columns" ADD COLUMN IF NOT EXISTS "user_id" uuid');
    expect(sql).toContain('ALTER TABLE "tasks" ALTER COLUMN "project_id" DROP NOT NULL');
    expect(sql).toContain('ALTER TABLE "task_columns" ALTER COLUMN "project_id" DROP NOT NULL');
    expect(sql).toContain("ON DELETE CASCADE");
    expect(sql).toContain("lower(trim(name))");
    expect(sql).toContain("A fazer");
    expect(sql).toContain('SET "project_id" = NULL');
  });

  it("schema de tarefas e colunas é por usuário, com obra opcional", () => {
    const schema = source("lib/db/schema.ts");
    expect(schema).toContain("task_columns_user_id_idx");
    expect(schema).toContain("tasks_user_id_idx");
    expect(schema).not.toContain("isMilestone");
    expect(schema).not.toContain("is_milestone");
  });

  it("rotas de kanban/gantt são por usuário, sem [projectId]", () => {
    const create = source("app/api/kanban/tasks/route.ts");
    const page = source("app/(app)/kanban/page.tsx");
    const redirect = source("app/(app)/kanban/[id]/page.tsx");
    const gantt = source("app/(app)/gantt/page.tsx");
    expect(create).toContain("resolveWritableProject");
    expect(create).toContain("userId: user.id");
    expect(page).toContain("ensureUserKanbanColumns");
    expect(page).toContain("ObraFilterBar");
    expect(page).not.toContain("Selecione uma obra");
    expect(redirect).toContain('redirect(`/kanban?obra=${encodeURIComponent(id)}`)');
    expect(gantt).toContain("groupByProject");
    expect(gantt).toContain("visibleUserTasksWhere");
  });
});

describe("sem marco", () => {
  it("migration 0012 normaliza datas e remove is_milestone", () => {
    const sql = source("migrations/0012_drop_milestone.sql");
    expect(sql).toContain('WHERE "is_milestone" = true');
    expect(sql).toContain("COALESCE");
    expect(sql).toContain('DROP COLUMN IF EXISTS "is_milestone"');
  });

  it("UI e APIs não expõem marco", () => {
    const files = [
      "components/task-dialog.tsx",
      "app/(app)/gantt/[id]/gantt-task-dialog.tsx",
      "app/(app)/gantt/[id]/gantt-chart.tsx",
      "app/(app)/calendario/calendar-view.tsx",
      "app/(app)/dashboard-view.tsx",
      "app/api/kanban/tasks/route.ts",
      "app/api/gantt/tasks/route.ts",
      "lib/gantt.ts",
    ];
    for (const file of files) {
      const text = source(file);
      expect(text, file).not.toMatch(/isMilestone|is_milestone|Marco de entrega|Novo marco|createMilestone/);
    }
  });
});

describe("tag de prioridade", () => {
  it("usa texto Baixa/Média/Alta com raio de Minhas tarefas e fill contrastado", () => {
    expect(priorityChip("task")).toBeNull();
    expect(priorityChip(null)).toBeNull();
    expect(PRIORITY_LABELS).toEqual({ low: "Baixa", medium: "Média", high: "Alta" });
    expect(PRIORITY_FILL).toEqual({ low: "done-wash", medium: "signal-wash", high: "delay-wash" });
    const alta = priorityChip("high");
    expect(alta?.label).toBe("Alta");
    expect(alta?.className).toContain(TASK_CHIP_CLASS);
    expect(alta?.className).toContain("ds-chip-surface");
    expect(alta?.className).not.toContain("ds-chip-pill");
    expect(priorityChip("low")?.label).toBe("Baixa");
    expect(priorityChip("medium")?.label).toBe("Média");
  });

  it("Kanban e Minhas tarefas usam a tag de texto, sem ícone Flag", () => {
    const card = source("app/(app)/kanban/[id]/task-card.tsx");
    const dashboard = source("app/(app)/dashboard-view.tsx");
    expect(card).toContain("PriorityTag");
    expect(card).not.toContain("Flag");
    expect(dashboard).toContain("PriorityTag");
    expect(dashboard).toContain("Minhas tarefas");
  });
});
