"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, Diamond, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GanttTaskDialog } from "./gantt-task-dialog";
import type { Task, TaskDependency } from "@/lib/db/schema";
import { formatISODate, today } from "@/lib/date";
import { dependencyConflict, isMilestoneTask, shiftSchedule, taskSchedule } from "@/lib/gantt";
import { GANTT_BAR_CLASS, formatGanttDateRange, ganttLabelFitsInside, isWeekend, taskBadgeTone } from "@/lib/calendar";
import {
  formatGanttHeaderBottom,
  formatGanttHeaderTop,
  ganttBarColumnSpan,
  ganttColumns,
  ganttMinColumnPx,
  shiftGanttCursor,
  type GanttZoom,
} from "@/lib/gantt-header";

const LABEL_W = 220;
const ROW_H = 48;

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
  colWidth: number;
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
  initialTasks,
  initialDependencies,
}: GanttChartProps) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<GanttZoom>("week");
  const [cursor, setCursor] = useState(() => today());
  const [tasks, setTasks] = useState(initialTasks);
  const [canDrag, setCanDrag] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [createMilestone, setCreateMilestone] = useState(false);
  const [timelinePx, setTimelinePx] = useState(0);

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanDrag(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const todayDate = useMemo(() => today(), []);
  const todayIso = formatISODate(todayDate);
  const columns = useMemo(() => ganttColumns(zoom, cursor), [cursor, zoom]);
  const minColWidth = ganttMinColumnPx(zoom);
  const colCount = columns.length;
  const colWidthPx = colCount > 0 && timelinePx > 0 ? timelinePx / colCount : minColWidth;
  const topLabel = formatGanttHeaderTop(zoom, columns[0]?.date ?? cursor, columns.at(-1)?.date ?? cursor);

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
    const node = timelineRef.current;
    if (!node) return;
    const measure = () => setTimelinePx(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [colCount, zoom]);

  const todayIndex = useMemo(() => {
    if (zoom === "day") {
      return sameDay(cursor, todayDate) ? new Date().getHours() : -1;
    }
    return columns.findIndex((column) => sameDay(column.date, todayDate));
  }, [columns, cursor, todayDate, zoom]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node || todayIndex < 0 || colWidthPx <= 0) return;
    const left = LABEL_W + todayIndex * colWidthPx - node.clientWidth / 3;
    node.scrollLeft = Math.max(0, left);
  }, [colWidthPx, todayIndex, zoom]);

  useEffect(() => {
    if (!drag) return;

    const handleMove = (event: PointerEvent) => {
      const delta = Math.round((event.clientX - drag.originX) / drag.colWidth);
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
      const delta = Math.round((event.clientX - drag.originX) / drag.colWidth);
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
  }, [drag, initialTasks, projectId, router]);

  const openCreate = (milestone: boolean) => {
    setEditingTask(null);
    setCreateMilestone(milestone);
    setDialogOpen(true);
  };

  const startDrag = (event: ReactPointerEvent, task: GanttTask, mode: DragState["mode"]) => {
    if (!canDrag || zoom === "day") return;
    const schedule = taskSchedule(task);
    if (!schedule) return;
    event.preventDefault();
    event.stopPropagation();
    setDrag({
      taskId: task.id,
      mode,
      originX: event.clientX,
      colWidth: colWidthPx,
      start: schedule.start,
      end: schedule.end,
      milestone: schedule.milestone,
    });
  };

  const allowDrag = canDrag && zoom !== "day";

  return (
    <div className="flex h-full flex-col gap-3 min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 overflow-hidden rounded-lg bg-white border-2 border-graphite p-0">
            {(["day", "week", "month"] as GanttZoom[]).map((option) => (
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
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="bg-white"
              aria-label="Anterior"
              onClick={() => setCursor((current) => shiftGanttCursor(current, zoom, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-white" onClick={() => setCursor(todayDate)}>
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-white"
              aria-label="Próximo"
              onClick={() => setCursor((current) => shiftGanttCursor(current, zoom, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden md:block text-xs text-muted-foreground">
            {allowDrag ? "Arraste a barra para mover; nas bordas, redimensione." : "Edite as datas pelo formulário da tarefa."}
          </p>
          <Button size="sm" variant="outline" className="bg-white" onClick={() => openCreate(true)}>
            <Diamond className="h-4 w-4 mr-1 text-primary" />Marco
          </Button>
          <Button size="sm" onClick={() => openCreate(false)}>
            <Plus className="h-4 w-4 mr-1" />Tarefa
          </Button>
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 min-h-0 overflow-auto rounded-lg border-2 border-graphite bg-white">
        <div className="w-full" style={{ minWidth: LABEL_W + colCount * minColWidth }}>
          <div className="sticky top-0 z-30 flex border-b bg-white">
            <div
              className="sticky left-0 z-40 shrink-0 border-r bg-white px-3 flex items-end pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              style={{ width: LABEL_W, minWidth: LABEL_W }}
            >
              Tarefa
            </div>
            <div ref={timelineRef} className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-8 items-center justify-center border-b px-2 text-xs font-semibold capitalize truncate">
                {topLabel}
              </div>
              <div className="flex h-8">
                {columns.map((column) => {
                  const isTodayCol =
                    zoom === "day" ? todayIndex === (column.hour ?? -1) : sameDay(column.date, todayDate);
                  const weekend = zoom !== "day" && isWeekend(column.date);
                  return (
                    <div
                      key={column.key}
                      className={`flex min-w-0 flex-1 items-center justify-center border-r font-mono text-[10px] leading-tight ${
                        isTodayCol ? "bg-primary text-primary-foreground font-semibold" : weekend ? "bg-concrete text-muted-foreground" : "text-muted-foreground"
                      }`}
                      style={{ minWidth: minColWidth }}
                    >
                      {formatGanttHeaderBottom(zoom, column.date, column.hour)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative">
            {todayIndex >= 0 && (
              <div
                className="absolute top-0 bottom-0 z-20 w-0.5 bg-primary pointer-events-none"
                style={{
                  left: `calc(${LABEL_W}px + ${(todayIndex + 0.5) / colCount} * (100% - ${LABEL_W}px))`,
                }}
                title="Hoje"
              />
            )}

            {orderedTasks.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                Nenhuma tarefa nesta obra. Crie no Gantt ou no Kanban — elas aparecem nos dois.
              </div>
            ) : (
              <>
                <svg
                  className="absolute top-0 z-[1] pointer-events-none"
                  style={{ left: LABEL_W, right: 0, height: orderedTasks.length * ROW_H }}
                  viewBox={`0 0 ${colCount} ${orderedTasks.length * ROW_H}`}
                  preserveAspectRatio="none"
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
                    const predSpan = ganttBarColumnSpan(zoom, columns, predBar.start, predBar.end);
                    const succSpan = ganttBarColumnSpan(zoom, columns, succBar.start, succBar.end);
                    if (!predSpan || !succSpan) return null;
                    const x1 = predSpan.endIndex + 1;
                    const x2 = succSpan.startIndex;
                    const y1 = predIndex * ROW_H + ROW_H / 2;
                    const y2 = succIndex * ROW_H + ROW_H / 2;
                    const elbow = x2 > x1 ? x1 + Math.max(0.4, (x2 - x1) / 3) : x1 + 0.6;
                    const conflict = dependencyConflict(succ, pred);
                    const color = conflict ? "#ba241c" : "#282320";
                    return (
                      <g key={dep.id}>
                        <path
                          d={`M ${x1} ${y1} H ${elbow} V ${y2} H ${x2}`}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    );
                  })}
                </svg>

                {orderedTasks.map((task) => {
                  const schedule = taskSchedule(task);
                  const conflict = conflictIds.has(task.id);
                  const tone = taskBadgeTone(task, task.columnName, todayIso);
                  const span = schedule
                    ? ganttBarColumnSpan(zoom, columns, schedule.start, schedule.end)
                    : null;
                  const spanCount = span ? span.endIndex - span.startIndex + 1 : 0;
                  const widthPx = spanCount * colWidthPx;
                  const labelInside = ganttLabelFitsInside(widthPx);
                  const tooltip = schedule ? barTooltip(task, schedule) : `${task.title} · sem datas`;

                  return (
                    <div key={task.id} className="relative flex border-b" style={{ height: ROW_H }}>
                      <button
                        type="button"
                        className="sticky left-0 z-20 shrink-0 border-r bg-white px-3 flex items-center gap-2 text-left hover:bg-concrete"
                        style={{ width: LABEL_W, minWidth: LABEL_W }}
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
                        className="relative flex min-w-0 flex-1"
                        onClick={() => {
                          if (!schedule) {
                            setEditingTask(task);
                            setDialogOpen(true);
                          }
                        }}
                      >
                        {columns.map((column) => {
                          const isTodayCol =
                            zoom === "day" ? todayIndex === (column.hour ?? -1) : sameDay(column.date, todayDate);
                          const weekend = zoom !== "day" && isWeekend(column.date);
                          return (
                            <div
                              key={column.key}
                              className={`min-w-0 flex-1 border-r pointer-events-none ${
                                isTodayCol ? "bg-signal-wash" : weekend ? "bg-concrete" : "bg-white"
                              }`}
                              style={{ minWidth: minColWidth }}
                            />
                          );
                        })}
                        {span ? (
                          <>
                            <div
                              role="button"
                              tabIndex={0}
                              className={`absolute top-1/2 -translate-y-1/2 z-[3] h-7 overflow-hidden text-xs flex items-center font-display uppercase tracking-wide ${
                                GANTT_BAR_CLASS[tone]
                              } ${conflict ? "ring-2 ring-delay" : ""} ${allowDrag ? "cursor-grab" : "cursor-pointer"}`}
                              style={{
                                left: `${(span.startIndex / colCount) * 100}%`,
                                width: `${(spanCount / colCount) * 100}%`,
                              }}
                              title={tooltip}
                              onPointerDown={(event) => startDrag(event, task, "move")}
                              onClick={() => {
                                if (allowDrag) return;
                                setEditingTask(task);
                                setDialogOpen(true);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  setEditingTask(task);
                                  setDialogOpen(true);
                                }
                              }}
                            >
                              {allowDrag && !isMilestoneTask(task) && (
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
                                <span className="truncate pointer-events-none px-2 flex items-center gap-1">
                                  {isMilestoneTask(task) && <Diamond className="h-3 w-3 shrink-0" />}
                                  {task.title}
                                </span>
                              )}
                            </div>
                            {!labelInside && (
                              <span
                                className="absolute top-1/2 -translate-y-1/2 z-[3] text-xs font-medium text-foreground pointer-events-none truncate max-w-[10rem]"
                                style={{ left: `calc(${((span.endIndex + 1) / colCount) * 100}% + 6px)` }}
                              >
                                {task.title}
                              </span>
                            )}
                          </>
                        ) : schedule ? (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            Fora desta visão
                          </span>
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
