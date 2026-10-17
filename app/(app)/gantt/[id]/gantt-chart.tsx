"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Diamond, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GanttTaskDialog } from "./gantt-task-dialog";
import type { Task, TaskDependency } from "@/lib/db/schema";
import { addDays, diffDays, eachDay, formatISODate, parseISODate, today } from "@/lib/date";
import { dependencyConflict, isMilestoneTask, shiftSchedule, taskSchedule } from "@/lib/gantt";
import {
  GANTT_BAR_CLASS,
  GANTT_MILESTONE_CLASS,
  WEEKDAY_LABELS,
  formatGanttDateRange,
  ganttLabelFitsInside,
  isWeekend,
  taskBadgeTone,
} from "@/lib/calendar";

type Zoom = "day" | "week" | "month";

const LABEL_W = 220;
const ROW_H = 48;
const HEADER_H = 72;
const PX: Record<Zoom, number> = { day: 44, week: 22, month: 8 };

export type GanttTask = Task & { columnName: string | null };

interface GanttChartProps {
  projectId: string;
  projectStart: string | null;
  projectEnd: string | null;
  initialTasks: GanttTask[];
  initialDependencies: TaskDependency[];
}

type DragState = {
  taskId: string;
  mode: "move" | "resize-start" | "resize-end";
  originX: number;
  start: Date;
  end: Date;
  milestone: boolean;
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function barTooltip(task: GanttTask, schedule: { start: Date; end: Date; milestone: boolean }) {
  const dates = formatGanttDateRange(schedule.start, schedule.end, schedule.milestone);
  const kind = schedule.milestone ? "Marco" : "Tarefa";
  return `${task.title} · ${kind} · ${dates}`;
}

export function GanttChart({
  projectId,
  projectStart,
  projectEnd,
  initialTasks,
  initialDependencies,
}: GanttChartProps) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<Zoom>("week");
  const [tasks, setTasks] = useState(initialTasks);
  const [canDrag, setCanDrag] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [createMilestone, setCreateMilestone] = useState(false);

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanDrag(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const pxPerDay = PX[zoom];
  const todayDate = useMemo(() => today(), []);
  const todayIso = formatISODate(todayDate);

  const range = useMemo(() => {
    const dates: Date[] = [todayDate, addDays(todayDate, 21), addDays(todayDate, -7)];
    if (projectStart) dates.push(parseISODate(projectStart));
    if (projectEnd) dates.push(parseISODate(projectEnd));
    for (const task of tasks) {
      const schedule = taskSchedule(task);
      if (!schedule) continue;
      dates.push(schedule.start, schedule.end);
    }
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    return { start: addDays(min, -2), end: addDays(max, 10) };
  }, [projectEnd, projectStart, tasks, todayDate]);

  const days = useMemo(() => eachDay(range.start, range.end), [range.end, range.start]);
  const timelineW = days.length * pxPerDay;
  const todayOffset = diffDays(todayDate, range.start) * pxPerDay + pxPerDay / 2;

  const monthGroups = useMemo(() => {
    const groups: { label: string; span: number }[] = [];
    for (const day of days) {
      const label = day.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.span += 1;
      else groups.push({ label, span: 1 });
    }
    return groups;
  }, [days]);

  const weekGroups = useMemo(() => {
    const groups: { label: string; span: number }[] = [];
    for (const day of days) {
      const sunday = new Date(day);
      sunday.setDate(day.getDate() - day.getDay());
      const saturday = addDays(sunday, 6);
      const label = `${sunday.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${saturday.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.span += 1;
      else groups.push({ label, span: 1 });
    }
    return groups;
  }, [days]);

  const orderedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const sa = taskSchedule(a);
        const sb = taskSchedule(b);
        if (!sa && !sb) return a.title.localeCompare(b.title, "pt-BR");
        if (!sa) return 1;
        if (!sb) return -1;
        return sa.start.getTime() - sb.start.getTime() || a.title.localeCompare(b.title, "pt-BR");
      }),
    [tasks]
  );

  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (const dep of initialDependencies) {
      const succ = tasks.find((task) => task.id === dep.taskId);
      const pred = tasks.find((task) => task.id === dep.dependsOnTaskId);
      if (succ && pred && dependencyConflict(succ, pred)) ids.add(succ.id);
    }
    return ids;
  }, [initialDependencies, tasks]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollLeft = Math.max(0, todayOffset - node.clientWidth / 2);
  }, [todayOffset, zoom]);

  useEffect(() => {
    if (!drag) return;

    const handleMove = (event: PointerEvent) => {
      const delta = Math.round((event.clientX - drag.originX) / pxPerDay);
      const next = shiftSchedule(drag.start, drag.end, delta, drag.mode, drag.milestone);
      setTasks((current) =>
        current.map((task) =>
          task.id === drag.taskId
            ? { ...task, startDate: next.startDate, dueDate: next.dueDate, endDate: next.dueDate }
            : task
        )
      );
    };

    const handleUp = async (event: PointerEvent) => {
      const delta = Math.round((event.clientX - drag.originX) / pxPerDay);
      const next = shiftSchedule(drag.start, drag.end, delta, drag.mode, drag.milestone);
      setDrag(null);
      if (delta === 0) {
        const task = initialTasks.find((item) => item.id === drag.taskId);
        if (task) {
          setEditingTask(task);
          setDialogOpen(true);
        }
        setTasks(initialTasks);
        return;
      }
      await fetch(`/api/gantt/${projectId}/tasks/${drag.taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: next.startDate, dueDate: next.dueDate }),
      });
      router.refresh();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [drag, initialTasks, projectId, pxPerDay, router]);

  const openCreate = (milestone: boolean) => {
    setEditingTask(null);
    setCreateMilestone(milestone);
    setDialogOpen(true);
  };

  const startDrag = (event: ReactPointerEvent, task: GanttTask, mode: DragState["mode"]) => {
    if (!canDrag) return;
    const schedule = taskSchedule(task);
    if (!schedule) return;
    event.preventDefault();
    event.stopPropagation();
    setDrag({
      taskId: task.id,
      mode,
      originX: event.clientX,
      start: schedule.start,
      end: schedule.end,
      milestone: schedule.milestone,
    });
  };

  const headerGroups = zoom === "month" ? monthGroups : weekGroups;

  return (
    <div className="flex h-full flex-col gap-3 min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white border-2 border-graphite p-0">
          {(["day", "week", "month"] as Zoom[]).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={zoom === option ? "default" : "ghost"}
              onClick={() => setZoom(option)}
            >
              {option === "day" ? "Dia" : option === "week" ? "Semana" : "Mês"}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden md:block text-xs text-muted-foreground">
            {canDrag ? "Arraste a barra para mover; nas bordas, redimensione." : "No celular, edite as datas pelo formulário."}
          </p>
          <Button size="sm" variant="outline" className="bg-white" onClick={() => openCreate(true)}>
            <Diamond className="h-4 w-4 mr-1 text-primary" />Marco
          </Button>
          <Button size="sm" onClick={() => openCreate(false)}>
            <Plus className="h-4 w-4 mr-1" />Tarefa
          </Button>
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 min-h-0 overflow-auto border-2 border-graphite bg-white">
        <div className="relative" style={{ minWidth: LABEL_W + timelineW }}>
          <div
            className="absolute top-0 bottom-0 z-20 w-0.5 bg-primary pointer-events-none"
            style={{ left: LABEL_W + todayOffset }}
            title="Hoje"
          />

          <div className="sticky top-0 z-30 flex border-b bg-white" style={{ height: HEADER_H }}>
            <div
              className="sticky left-0 z-40 shrink-0 border-r bg-white px-3 flex items-end pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              style={{ width: LABEL_W }}
            >
              Tarefa
            </div>
            <div className="flex flex-col" style={{ width: timelineW }}>
              <div className="flex h-7 border-b text-[11px] font-medium">
                {headerGroups.map((group) => (
                  <div
                    key={group.label + group.span}
                    className="shrink-0 border-r px-2 flex items-center truncate capitalize"
                    style={{ width: group.span * pxPerDay }}
                  >
                    {group.label}
                  </div>
                ))}
              </div>
              <div className="flex flex-1 text-[10px] text-muted-foreground">
                {days.map((day) => {
                  const weekend = isWeekend(day);
                  const isToday = sameDay(day, todayDate);
                  const weekday = WEEKDAY_LABELS[day.getDay()];
                  const showDate =
                    zoom === "day" ||
                    (zoom === "week" && day.getDay() === 1) ||
                    (zoom === "month" && day.getDate() === 1);
                  return (
                    <div
                      key={formatISODate(day)}
                      className={`shrink-0 border-r h-full flex flex-col items-center justify-center leading-tight ${
                        isToday ? "bg-primary text-primary-foreground font-semibold" : weekend ? "bg-concrete" : ""
                      }`}
                      style={{ width: pxPerDay }}
                    >
                      {zoom !== "month" && <span className="text-[8px] uppercase leading-none truncate w-full text-center">{weekday}</span>}
                      {showDate ? (zoom === "month" ? day.getDate() : day.toLocaleDateString("pt-BR", { day: "2-digit" })) : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative">
            {orderedTasks.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                Nenhuma tarefa nesta obra. Crie no Gantt ou no Kanban — elas aparecem nos dois.
              </div>
            ) : (
              <>
                <svg
                  className="absolute top-0 z-[1] pointer-events-none"
                  style={{ left: LABEL_W, width: timelineW, height: orderedTasks.length * ROW_H }}
                >
                  {initialDependencies.map((dep) => {
                    const succIndex = orderedTasks.findIndex((task) => task.id === dep.taskId);
                    const predIndex = orderedTasks.findIndex((task) => task.id === dep.dependsOnTaskId);
                    const succ = orderedTasks[succIndex];
                    const pred = orderedTasks[predIndex];
                    if (succIndex < 0 || predIndex < 0 || !succ || !pred) return null;
                    const predBar = taskSchedule(pred);
                    const succBar = taskSchedule(succ);
                    if (!predBar || !succBar) return null;
                    const x1 = diffDays(predBar.end, range.start) * pxPerDay + (isMilestoneTask(pred) ? pxPerDay / 2 : pxPerDay);
                    const x2 = diffDays(succBar.start, range.start) * pxPerDay + (isMilestoneTask(succ) ? pxPerDay / 2 : 0);
                    const y1 = predIndex * ROW_H + ROW_H / 2;
                    const y2 = succIndex * ROW_H + ROW_H / 2;
                    const elbow = x2 > x1 ? x1 + Math.max(16, (x2 - x1) / 3) : x1 + 20;
                    const conflict = dependencyConflict(succ, pred);
                    const color = conflict ? "#ba241c" : "#282320";
                    return (
                      <g key={dep.id}>
                        <path
                          d={`M ${x1} ${y1} H ${elbow} V ${y2} H ${x2}`}
                          fill="none"
                          stroke={color}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polygon
                          points={`${x2},${y2} ${x2 - 8},${y2 - 5} ${x2 - 8},${y2 + 5}`}
                          fill={color}
                        />
                      </g>
                    );
                  })}
                </svg>

                {orderedTasks.map((task) => {
                  const schedule = taskSchedule(task);
                  const conflict = conflictIds.has(task.id);
                  const tone = taskBadgeTone(task, task.columnName, todayIso);
                  const left = schedule ? diffDays(schedule.start, range.start) * pxPerDay : 0;
                  const width = schedule
                    ? Math.max((diffDays(schedule.end, schedule.start) + 1) * pxPerDay, pxPerDay)
                    : 0;
                  const labelInside = ganttLabelFitsInside(width);
                  const tooltip = schedule ? barTooltip(task, schedule) : `${task.title} · sem datas`;

                  return (
                    <div key={task.id} className="relative flex border-b" style={{ height: ROW_H }}>
                      <button
                        type="button"
                        className="sticky left-0 z-20 shrink-0 border-r bg-white px-3 flex items-center gap-2 text-left hover:bg-concrete"
                        style={{ width: LABEL_W }}
                        onClick={() => {
                          setEditingTask(task);
                          setDialogOpen(true);
                        }}
                      >
                        {conflict && <AlertTriangle className="h-3.5 w-3.5 text-delay shrink-0" />}
                        {isMilestoneTask(task) && <Diamond className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <span className="truncate text-sm text-foreground">{task.title}</span>
                      </button>
                      <div
                        className="relative"
                        style={{ width: timelineW }}
                        onClick={() => {
                          if (!schedule) {
                            setEditingTask(task);
                            setDialogOpen(true);
                          }
                        }}
                      >
                        {days.map((day) => (
                          <div
                            key={formatISODate(day)}
                            className={`absolute top-0 bottom-0 border-r pointer-events-none ${
                              sameDay(day, todayDate) ? "bg-signal-wash" : isWeekend(day) ? "bg-concrete" : ""
                            }`}
                            style={{ left: diffDays(day, range.start) * pxPerDay, width: pxPerDay }}
                          />
                        ))}
                        {schedule && isMilestoneTask(task) ? (
                          <>
                            <button
                              type="button"
                              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-[3] h-4 w-4 rotate-45 border shadow-sm ${
                                GANTT_MILESTONE_CLASS[tone]
                              } ${conflict ? "ring-2 ring-delay" : ""} ${canDrag ? "cursor-grab" : "cursor-pointer"}`}
                              style={{ left: left + pxPerDay / 2 }}
                              title={tooltip}
                              onPointerDown={(event) => startDrag(event, task, "move")}
                              onClick={() => {
                                if (canDrag) return;
                                setEditingTask(task);
                                setDialogOpen(true);
                              }}
                            />
                            <span
                              className="absolute top-1/2 -translate-y-1/2 z-[3] text-xs font-medium text-foreground pointer-events-none truncate max-w-[10rem]"
                              style={{ left: left + pxPerDay / 2 + 14 }}
                            >
                              {task.title}
                            </span>
                          </>
                        ) : schedule ? (
                          <>
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 z-[3] h-7 rounded-none border text-xs flex items-center overflow-visible font-display uppercase tracking-wide ${
                                GANTT_BAR_CLASS[tone]
                              } ${conflict ? "ring-2 ring-delay" : ""} ${canDrag ? "cursor-grab" : "cursor-pointer"}`}
                              style={{ left, width }}
                              title={tooltip}
                              onPointerDown={(event) => startDrag(event, task, "move")}
                              onClick={() => {
                                if (canDrag) return;
                                setEditingTask(task);
                                setDialogOpen(true);
                              }}
                            >
                              {canDrag && (
                                <>
                                  <span
                                    className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
                                    onPointerDown={(event) => startDrag(event, task, "resize-start")}
                                  />
                                  <span
                                    className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
                                    onPointerDown={(event) => startDrag(event, task, "resize-end")}
                                  />
                                </>
                              )}
                              {labelInside && (
                                <span className="truncate pointer-events-none px-2">{task.title}</span>
                              )}
                            </div>
                            {!labelInside && (
                              <span
                                className="absolute top-1/2 -translate-y-1/2 z-[3] ml-1.5 text-xs font-medium text-foreground pointer-events-none truncate max-w-[10rem]"
                                style={{ left: left + width + 6 }}
                              >
                                {task.title}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            Sem datas — toque para definir
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      <GanttTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        task={editingTask}
        createMilestone={createMilestone}
        tasks={tasks}
        dependencies={initialDependencies}
      />
    </div>
  );
}
