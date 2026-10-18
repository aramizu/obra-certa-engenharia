"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Package, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, Select, StatCard, TASK_CHIP_CLASS, chipContrastStyle } from "@/components/ds";
import { cn } from "@/lib/utils";
import { PriorityTag } from "@/components/priority-tag";
import { TaskDialog } from "@/components/task-dialog";
import type { Task } from "@/lib/db/schema";
import { formatBRL } from "@/lib/format";
import { addDays, endOfWeekSunday, formatISODate, todayInTimeZone } from "@/lib/date";
import { isDoneColumn, isOverdueTask, isWeekOrOverdueTask, relativeDueChip, taskDueIso } from "@/lib/calendar";
import { BudgetChart, type BudgetChartRow } from "./budget-chart";
import { afterMutation } from "@/lib/after-mutation";
import { isCompradoStatus, isToBuyStatus } from "@/lib/item-status";
import { SEM_OBRA_LABEL, obraChipLabel } from "@/lib/user-tasks";

export type DashboardTask = Task & { projectName: string | null; columnName: string | null };

export type DashboardMaterial = {
  id: string;
  name: string;
  brand: string | null;
  totalPrice: string | null;
  status: string;
  projectId: string;
  projectName: string;
  supplierId: string | null;
};

export type DashboardCategory = BudgetChartRow & { projectId: string };

interface DashboardViewProps {
  userName: string;
  projects: { id: string; name: string; totalBudget: string }[];
  tasks: DashboardTask[];
  materials: DashboardMaterial[];
  categories: DashboardCategory[];
}

function TaskMetric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-mono text-3xl font-semibold tabular-nums leading-none",
          alert && value > 0 && "text-delay"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function DashboardView({ projects, tasks, materials, categories }: DashboardViewProps) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const todayDate = useMemo(() => todayInTimeZone(), []);
  const todayIso = formatISODate(todayDate);
  const weekIso = formatISODate(addDays(todayDate, 7));
  const weekEndIso = formatISODate(endOfWeekSunday(todayDate));

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (projectId === "all") return true;
        if (projectId === "none") return !task.projectId;
        return task.projectId === projectId;
      }),
    [projectId, tasks]
  );
  const filteredMaterials = useMemo(
    () => materials.filter((item) => projectId === "all" || item.projectId === projectId),
    [materials, projectId]
  );
  const filteredProjects = useMemo(
    () => (projectId === "all" ? projects : projects.filter((project) => project.id === projectId)),
    [projectId, projects]
  );
  const filteredCategories = useMemo(
    () => (projectId === "all" ? categories : categories.filter((row) => row.projectId === projectId)),
    [categories, projectId]
  );

  const totalBudget = filteredProjects.reduce((sum, project) => sum + parseFloat(project.totalBudget || "0"), 0);
  const planned = filteredCategories.reduce((sum, row) => sum + row.budgeted, 0);
  const spent = filteredMaterials
    .filter((item) => isCompradoStatus(item.status))
    .reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);
  const budgetBase = totalBudget > 0 ? totalBudget : planned;
  const remaining = budgetBase - spent;
  const usedPct = budgetBase > 0 ? (spent / budgetBase) * 100 : 0;

  const openTasks = filteredTasks.filter((task) => !isDoneColumn(task.columnName));
  const overdue = openTasks.filter((task) => isOverdueTask(task, task.columnName, todayIso));
  const dueSoon = openTasks.filter((task) => {
    const due = taskDueIso(task);
    return Boolean(due && due >= todayIso && due <= weekIso);
  });
  const weekTasks = [...openTasks]
    .filter((task) => isWeekOrOverdueTask(task, task.columnName, weekEndIso))
    .sort((a, b) => {
      const dueA = a.dueDate || a.endDate || "";
      const dueB = b.dueDate || b.endDate || "";
      return dueA.localeCompare(dueB) || a.title.localeCompare(b.title, "pt-BR");
    });
  const unlinkedTasks = filteredTasks.filter((task) => !task.projectId).length;
  const toBuy = filteredMaterials.filter((item) => isToBuyStatus(item.status));
  const toBuyTotal = toBuy.reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);

  const chartRows = useMemo(() => {
    const byName = new Map<string, BudgetChartRow>();
    for (const row of filteredCategories) {
      const current = byName.get(row.name) ?? { name: row.name, budgeted: 0, spent: 0 };
      current.budgeted += row.budgeted;
      current.spent += row.spent;
      byName.set(row.name, current);
    }
    return [...byName.values()];
  }, [filteredCategories]);

  const openTask = (task: DashboardTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const toggleMaterial = async (item: DashboardMaterial) => {
    setTogglingId(item.id);
    try {
      const next = isCompradoStatus(item.status) ? "cotando" : "comprado";
      const response = await fetch(`/api/materiais/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error();
      await afterMutation(() => router.refresh(), { projectId: item.projectId });
    } catch {
      alert("Erro ao atualizar status da compra");
    } finally {
      setTogglingId(null);
    }
  };

  const selectedProjectId = projectId === "all" || projectId === "none" ? undefined : projectId;
  const hasProjects = projects.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm flex items-center gap-2">
          <span className="text-label">Obra</span>
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 w-auto min-w-40"
          >
            <option value="all">Todas</option>
            <option value="none">{SEM_OBRA_LABEL}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </Select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Link prefetch href="/obras" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
            <Plus className="h-4 w-4 mr-1" />Obra
          </Link>
          <Link prefetch href="/kanban" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
            <Plus className="h-4 w-4 mr-1" />Tarefa
          </Link>
          <Link prefetch href={selectedProjectId ? `/obras/${selectedProjectId}` : "/obras"} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
            <Plus className="h-4 w-4 mr-1" />Item
          </Link>
        </div>
      </div>

      {!hasProjects && (
        <Card>
          <EmptyState
            illustration="helmet"
            title="Nenhuma obra no canteiro"
            description="Comece pelo cadastro da obra para acompanhar orçamento, tarefas e compras."
            action={<Link prefetch href="/obras" className={buttonVariants()}>Criar obra</Link>}
          />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Orçamento total" value={formatBRL(budgetBase, true)} hint={`Previsto ${formatBRL(planned || budgetBase, true)}`} />
        <StatCard label="Gasto em materiais" value={formatBRL(spent, true)} hint="Compras marcadas como compradas" />
        <StatCard
          label="Saldo"
          value={formatBRL(remaining, true)}
          progress={usedPct}
          valueClassName={remaining < 0 ? "text-delay" : ""}
          hint={`${usedPct.toFixed(0)}% do orçamento`}
        />
      </div>

      <Card className="bg-white overflow-hidden">
        <div className="flex items-center border-b-2 border-graphite bg-blueprint-wash px-4 py-2">
          <p className="text-label m-0">Tarefas</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          <TaskMetric label="Tarefas sem obra" value={unlinkedTasks} />
          <TaskMetric label="Abertas" value={openTasks.length} />
          <TaskMetric label="Atrasadas" value={overdue.length} alert />
          <TaskMetric label="Vence em 7 dias" value={dueSoon.length} />
        </div>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />Tarefas da semana
              </CardTitle>
              <CardDescription>Vencidas e com prazo de segunda a domingo</CardDescription>
            </div>
            <Link
              prefetch
              href="/kanban"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white shrink-0")}
            >
              Ver mais tarefas
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {weekTasks.length === 0 ? (
            <EmptyState
              illustration="plan"
              className="py-8"
              title="Semana em dia"
              description="Nenhuma tarefa vencida ou com prazo nesta semana."
            />
          ) : (
            <ul className="space-y-2">
              {weekTasks.map((task) => {
                const due = task.dueDate || task.endDate;
                const chip = due ? relativeDueChip(due, todayIso) : null;
                const obra = obraChipLabel(task.projectName);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => openTask(task)}
                      className={`${TASK_CHIP_CLASS} w-full text-left px-3 py-2 hover:brightness-95`}
                      data-fill="white"
                      style={chipContrastStyle("white")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm truncate">{task.title}</span>
                        <span className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                          {chip && (
                            <span
                              className="ds-chip-surface ds-chip-pill text-[10px] font-mono px-2 py-0.5"
                              data-fill={chip.fill}
                              style={chipContrastStyle(chip.fill)}
                            >
                              {chip.label}
                            </span>
                          )}
                          <PriorityTag taskType={task.taskType} />
                          {obra && (
                            <span
                              className="ds-chip-surface ds-chip-pill inline-flex text-[10px] font-display uppercase tracking-wide px-2 py-0.5"
                              data-fill="concrete"
                              style={chipContrastStyle("concrete")}
                            >
                              {obra}
                            </span>
                          )}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" />Para comprar</CardTitle>
              <CardDescription>Itens a definir ou em cotação</CardDescription>
            </div>
            <p className="text-sm font-data tabular-nums font-semibold">{formatBRL(toBuyTotal)}</p>
          </div>
        </CardHeader>
        <CardContent>
          {toBuy.length === 0 ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Nada pendente de compra neste recorte.</p>
              <Link prefetch href={selectedProjectId ? `/obras/${selectedProjectId}` : "/obras"} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
                Ver itens da obra
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {toBuy.slice(0, 10).map((item) => (
                <li key={item.id} className={`${TASK_CHIP_CLASS} flex items-center justify-between gap-3 px-3 py-2`} data-fill="white" style={chipContrastStyle("white")}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}{item.brand ? ` · ${item.brand}` : ""}</p>
                    <p className="text-xs truncate opacity-80">{item.projectName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-data tabular-nums">{formatBRL(parseFloat(item.totalPrice || "0"))}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white"
                      disabled={togglingId === item.id}
                      onClick={() => toggleMaterial(item)}
                    >
                      {togglingId === item.id ? "..." : "Comprar"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Orçamento por grupo</CardTitle>
          <CardDescription>Previsto versus gasto (itens comprados)</CardDescription>
        </CardHeader>
        <CardContent>
          {chartRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre grupos na obra para ver o gráfico.</p>
          ) : (
            <BudgetChart rows={chartRows} />
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={editingTask?.projectId || selectedProjectId}
        projects={projects}
        task={editingTask}
      />
    </div>
  );
}
