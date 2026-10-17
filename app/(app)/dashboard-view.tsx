"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, Diamond, Package, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/task-dialog";
import type { Task } from "@/lib/db/schema";
import { formatBRL } from "@/lib/format";
import { addDays, formatISODate, today } from "@/lib/date";
import { BADGE_CLASS, isAssignedToUser, isDoneColumn, isOverdueTask, taskBadgeTone } from "@/lib/calendar";
import { BudgetChart, type BudgetChartRow } from "./budget-chart";

export type DashboardTask = Task & { projectName: string; columnName: string | null };

export type DashboardMaterial = {
  id: string;
  name: string;
  brand: string | null;
  totalPrice: string;
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

function dueIso(task: DashboardTask) {
  return task.dueDate || task.endDate || task.startDate;
}

export function DashboardView({ userName, projects, tasks, materials, categories }: DashboardViewProps) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const todayDate = useMemo(() => today(), []);
  const todayIso = formatISODate(todayDate);
  const weekIso = formatISODate(addDays(todayDate, 7));

  const filteredTasks = useMemo(
    () => tasks.filter((task) => projectId === "all" || task.projectId === projectId),
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
    .filter((item) => item.status === "purchased")
    .reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);
  const budgetBase = totalBudget > 0 ? totalBudget : planned;
  const remaining = budgetBase - spent;
  const usedPct = budgetBase > 0 ? (spent / budgetBase) * 100 : 0;

  const openTasks = filteredTasks.filter((task) => !isDoneColumn(task.columnName));
  const overdue = openTasks.filter((task) => isOverdueTask(task, task.columnName, todayIso));
  const dueSoon = openTasks.filter((task) => {
    const due = dueIso(task);
    return Boolean(due && due >= todayIso && due <= weekIso);
  });
  const nextMilestone = openTasks
    .filter((task) => task.isMilestone)
    .map((task) => ({ task, date: dueIso(task) }))
    .filter((item) => item.date && item.date >= todayIso)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))[0]?.task ?? null;

  const pending = [...overdue, ...dueSoon.filter((task) => !overdue.some((item) => item.id === task.id))];
  const myTasks = openTasks.filter((task) => isAssignedToUser(task, userName));
  const toBuy = filteredMaterials.filter((item) => item.status !== "purchased");
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
      const next = item.status === "purchased" ? "quoted" : "purchased";
      const response = await fetch(`/api/materiais/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Erro ao atualizar status da compra");
    } finally {
      setTogglingId(null);
    }
  };

  const selectedProjectId = projectId === "all" ? undefined : projectId;
  const hasProjects = projects.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm flex items-center gap-2">
          <span className="text-muted-foreground">Obra</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 rounded-md border border-input bg-white px-2 text-sm"
          >
            <option value="all">Todas as obras</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Link href="/obras" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
            <Plus className="h-4 w-4 mr-1" />Obra
          </Link>
          <Link href="/kanban" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
            <Plus className="h-4 w-4 mr-1" />Tarefa
          </Link>
          <Link href="/fornecedores" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
            <Plus className="h-4 w-4 mr-1" />Material
          </Link>
        </div>
      </div>

      {!hasProjects && (
        <Card className="bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <p className="text-lg text-muted-foreground">Nenhuma obra cadastrada ainda</p>
            <p className="text-sm text-muted-foreground">Comece pelo cadastro da obra para acompanhar orçamento, tarefas e compras.</p>
            <Link href="/obras" className={buttonVariants()}>Criar obra</Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Orçamento total</CardDescription>
            <CardTitle className="text-2xl font-data tabular-nums">{formatBRL(budgetBase, true)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Previsto {formatBRL(planned || budgetBase, true)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Gasto em materiais</CardDescription>
            <CardTitle className="text-2xl font-data tabular-nums">{formatBRL(spent, true)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Compras marcadas como compradas</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Saldo</CardDescription>
            <CardTitle className={`text-2xl font-data tabular-nums ${remaining < 0 ? "text-destructive" : ""}`}>
              {formatBRL(remaining, true)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div className={`h-full ${usedPct > 100 ? "bg-destructive" : "bg-accent"}`} style={{ width: `${Math.min(usedPct, 100)}%` }} />
              </div>
              <span className="text-xs font-data tabular-nums text-muted-foreground">{usedPct.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Próximo marco</CardDescription>
            <CardTitle className="text-lg leading-snug">
              {nextMilestone ? nextMilestone.title : "Nenhum marco à frente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {nextMilestone
                ? `${dueIso(nextMilestone) && new Date(dueIso(nextMilestone)! + "T00:00:00").toLocaleDateString("pt-BR")} · ${nextMilestone.projectName}`
                : "Cadastre um marco no Gantt ou no Kanban"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Tarefas abertas</CardDescription>
            <CardTitle className="text-3xl font-data tabular-nums">{openTasks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Atrasadas</CardDescription>
            <CardTitle className="text-3xl font-data tabular-nums text-destructive">{overdue.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Vencem em 7 dias</CardDescription>
            <CardTitle className="text-3xl font-data tabular-nums">{dueSoon.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Pendências</CardTitle>
            <CardDescription>Atrasadas e com prazo nesta semana</CardDescription>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Nenhuma pendência no recorte atual.</p>
                <Link href="/calendario" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
                  Ver calendário
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {pending.slice(0, 8).map((task) => {
                  const tone = taskBadgeTone(task, task.columnName, todayIso);
                  const due = dueIso(task);
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => openTask(task)}
                        className={`w-full text-left rounded-md border px-3 py-2 ${BADGE_CLASS[tone]}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{task.title}</span>
                          {due && (
                            <span className="text-xs tabular-nums shrink-0">
                              {new Date(due + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1 opacity-80 truncate">{task.projectName}</p>
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
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />Minhas tarefas</CardTitle>
            <CardDescription>Responsável = você (ou sem responsável)</CardDescription>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Nenhuma tarefa sua em aberto.</p>
                <Link href="/kanban" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
                  Criar tarefa
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {myTasks.slice(0, 8).map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => openTask(task)}
                      className="w-full text-left rounded-md border bg-white px-3 py-2 hover:border-accent"
                    >
                      <div className="flex items-center gap-2">
                        {task.isMilestone && <Diamond className="h-3.5 w-3.5 text-accent" />}
                        <span className="font-medium text-sm truncate">{task.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {task.projectName}
                        {dueIso(task) ? ` · ${new Date(dueIso(task)! + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" />Para comprar</CardTitle>
              <CardDescription>Materiais ainda não comprados</CardDescription>
            </div>
            <p className="text-sm font-data tabular-nums font-semibold">{formatBRL(toBuyTotal)}</p>
          </div>
        </CardHeader>
        <CardContent>
          {toBuy.length === 0 ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Nada pendente de compra neste recorte.</p>
              <Link href="/fornecedores" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white")}>
                Cadastrar material
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {toBuy.slice(0, 10).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}{item.brand ? ` · ${item.brand}` : ""}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.projectName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-data tabular-nums">{formatBRL(parseFloat(item.totalPrice))}</span>
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
          <CardTitle>Orçamento por categoria</CardTitle>
          <CardDescription>Previsto versus gasto (materiais comprados)</CardDescription>
        </CardHeader>
        <CardContent>
          {chartRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre categorias na obra para ver o gráfico.</p>
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
