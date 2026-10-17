"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Tabs } from "@/components/ds";
import { TaskDialog } from "@/components/task-dialog";
import type { Task } from "@/lib/db/schema";
import { formatISODate, today } from "@/lib/date";
import {
  BADGE_CLASS,
  DOT_CLASS,
  WEEKDAY_LABELS,
  isAssignedToUser,
  monthGrid,
  taskBadgeTone,
  taskOccursOn,
  weekGrid,
} from "@/lib/calendar";

export type CalendarTask = Task & { projectName: string; columnName: string | null };

type ViewMode = "month" | "week";

interface CalendarViewProps {
  tasks: CalendarTask[];
  projects: { id: string; name: string }[];
  userName: string;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarView({ tasks, projects, userName }: CalendarViewProps) {
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => today());
  const [selected, setSelected] = useState(() => today());
  const [projectId, setProjectId] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);

  const todayDate = useMemo(() => today(), []);
  const todayIso = formatISODate(todayDate);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (projectId !== "all" && task.projectId !== projectId) return false;
      if (mineOnly && !isAssignedToUser(task, userName)) return false;
      return Boolean(task.startDate || task.dueDate || task.endDate);
    });
  }, [mineOnly, projectId, tasks, userName]);

  const days = view === "month"
    ? monthGrid(cursor.getFullYear(), cursor.getMonth())
    : weekGrid(cursor);

  const title = view === "month"
    ? cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : `Semana de ${days[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} a ${days[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const day of days) {
      const iso = formatISODate(day);
      map.set(
        iso,
        filtered
          .filter((task) => taskOccursOn(task, iso))
          .sort((a, b) => {
            const dueA = a.dueDate || a.endDate || a.startDate || "";
            const dueB = b.dueDate || b.endDate || b.startDate || "";
            return dueA.localeCompare(dueB) || a.title.localeCompare(b.title, "pt-BR");
          })
      );
    }
    return map;
  }, [days, filtered]);

  const selectedIso = formatISODate(selected);
  const selectedTasks = tasksByDay.get(selectedIso) ?? [];

  const go = (offset: number) => {
    setCursor((current) => {
      const next = new Date(current);
      if (view === "month") next.setMonth(next.getMonth() + offset);
      else next.setDate(next.getDate() + offset * 7);
      return next;
    });
  };

  const goToday = () => {
    const now = today();
    setCursor(now);
    setSelected(now);
  };

  const openTask = (task: CalendarTask, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setEditingTask(task);
    setDefaultDate(undefined);
    setDialogOpen(true);
  };

  const openNew = (date: Date) => {
    const iso = formatISODate(date);
    setEditingTask(undefined);
    setDefaultDate(iso);
    setSelected(date);
    setDialogOpen(true);
  };

  const inCurrentMonth = (date: Date) => date.getMonth() === cursor.getMonth();

  const selectedProjectId = projectId === "all" ? undefined : projectId;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="rounded-lg bg-white border-2 border-graphite ds-shadow p-3 lg:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Anterior" className="bg-white">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday} className="bg-white">Hoje</Button>
            <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Próximo" className="bg-white">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-title capitalize text-center flex-1 min-w-[12rem]">
            {title}
          </h2>
          <Tabs
            value={view}
            onChange={(value) => setView(value as ViewMode)}
            items={[
              { value: "month", label: "Mês" },
              { value: "week", label: "Semana" },
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="text-sm flex items-center gap-2">
            <span className="text-muted-foreground">Obra</span>
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-9 w-auto min-w-40"
            >
              <option value="all">Todas as obras</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </Select>
          </label>
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
            />
            Minhas tarefas
          </label>
        </div>
      </div>

      <div className="hidden md:block overflow-hidden rounded-lg bg-white border-2 border-graphite">
        <div className="grid grid-cols-7 border-b bg-blueprint-wash">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
              {label}
            </div>
          ))}
        </div>
        <div className={`grid grid-cols-7 ${view === "week" ? "auto-rows-[min(28rem,70vh)]" : ""}`}>
          {days.map((day) => {
            const iso = formatISODate(day);
            const dayTasks = tasksByDay.get(iso) ?? [];
            const visible = view === "week" ? dayTasks : dayTasks.slice(0, 3);
            const extra = view === "month" ? Math.max(0, dayTasks.length - 3) : 0;
            const isToday = sameDay(day, todayDate);
            const muted = view === "month" && !inCurrentMonth(day);

            return (
              <div
                key={iso}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelected(day);
                  if (view === "month") setCursor(new Date(day.getFullYear(), day.getMonth(), 1));
                  if (dayTasks.length === 0) openNew(day);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(day);
                    if (dayTasks.length === 0) openNew(day);
                  }
                }}
                className={`min-h-[7.5rem] border-r border-b p-1.5 text-left align-top hover:bg-concrete cursor-pointer ${
                  view === "week" ? "min-h-0" : ""
                } ${muted ? "bg-concrete text-muted-foreground" : "bg-white"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-mono ${
                      isToday ? "bg-primary text-primary-foreground font-semibold" : ""
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">{dayTasks.length}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {visible.map((task) => {
                    const tone = taskBadgeTone(task, task.columnName, todayIso);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={(event) => openTask(task, event)}
                        className={`block w-full truncate border px-1.5 py-0.5 text-[11px] leading-tight text-left font-display uppercase tracking-wide ${BADGE_CLASS[tone]}`}
                        title={`${task.title}${task.isMilestone ? " · Marco" : ""}${task.projectName ? ` · ${task.projectName}` : ""}`}
                      >
                        {task.isMilestone && <Diamond className="inline h-3 w-3 mr-1 -mt-0.5" />}
                        {task.title}
                      </button>
                    );
                  })}
                  {extra > 0 && (
                    <span className="block text-[10px] text-muted-foreground px-1">+{extra} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {view === "month" ? (
          <div className="overflow-hidden rounded-lg bg-white border-2 border-graphite">
            <div className="grid grid-cols-7 border-b bg-blueprint-wash">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="py-2 text-[11px] font-semibold text-center text-muted-foreground">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const iso = formatISODate(day);
                const dayTasks = tasksByDay.get(iso) ?? [];
                const isToday = sameDay(day, todayDate);
                const isSelected = sameDay(day, selected);
                const muted = !inCurrentMonth(day);
                const tones = [...new Set(dayTasks.map((task) => taskBadgeTone(task, task.columnName, todayIso)))].slice(0, 3);

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      const already = sameDay(day, selected);
                      setSelected(day);
                      setCursor(new Date(day.getFullYear(), day.getMonth(), 1));
                      if (already && dayTasks.length === 0) openNew(day);
                    }}
                    className={`h-14 border-r border-b flex flex-col items-center justify-center gap-1 ${
                      muted ? "text-muted-foreground" : ""
                    } ${isSelected ? "bg-blueprint-wash" : "bg-white"}`}
                  >
                    <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-mono ${isToday ? "bg-primary text-primary-foreground font-semibold" : ""}`}>
                      {day.getDate()}
                    </span>
                    <span className="flex gap-0.5 h-1.5">
                      {tones.map((tone) => (
                        <span key={tone} className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[tone]}`} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {days.map((day) => {
              const iso = formatISODate(day);
              const dayTasks = tasksByDay.get(iso) ?? [];
              const isToday = sameDay(day, todayDate);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(day)}
                  className={`w-full text-left rounded-lg bg-white border-2 border-graphite p-3 ${sameDay(day, selected) ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium capitalize ${isToday ? "text-accent" : ""}`}>
                      {day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}
                    </span>
                    <span className="text-xs text-muted-foreground">{dayTasks.length}</span>
                  </div>
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma tarefa</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {dayTasks.slice(0, 4).map((task) => (
                        <span key={task.id} className={`text-[11px] border px-1.5 py-0.5 font-display uppercase tracking-wide ${BADGE_CLASS[taskBadgeTone(task, task.columnName, todayIso)]}`}>
                          {task.title}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="rounded-lg bg-white border-2 border-graphite ds-shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold capitalize">
              {selected.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </h3>
            <Button size="sm" variant="outline" className="bg-white" onClick={() => openNew(selected)}>
              Nova
            </Button>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {selectedTasks.map((task) => {
                const tone = taskBadgeTone(task, task.columnName, todayIso);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => openTask(task)}
                      className={`w-full text-left border px-3 py-2 ${BADGE_CLASS[tone]}`}
                    >
                      <div className="flex items-center gap-2">
                        {task.isMilestone && <Diamond className="h-3.5 w-3.5" />}
                        <span className="font-medium text-sm">{task.title}</span>
                      </div>
                      <p className="text-xs mt-1 opacity-80">{task.projectName}{task.columnName ? ` · ${task.columnName}` : ""}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="hidden md:flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className={`border px-2 py-0.5 ${BADGE_CLASS.high}`}>Alta</span>
        <span className={`border px-2 py-0.5 ${BADGE_CLASS.medium}`}>Média</span>
        <span className={`border px-2 py-0.5 ${BADGE_CLASS.low}`}>Baixa</span>
        <span className={`border px-2 py-0.5 ${BADGE_CLASS.milestone}`}>Marco</span>
        <span className={`border px-2 py-0.5 ${BADGE_CLASS.overdue}`}>Atrasada</span>
        <span className={`border px-2 py-0.5 ${BADGE_CLASS.done}`}>Concluída</span>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={editingTask?.projectId || selectedProjectId}
        projects={projects}
        task={editingTask}
        defaultStartDate={editingTask ? undefined : defaultDate}
        defaultDueDate={editingTask ? undefined : defaultDate}
      />
    </div>
  );
}
