"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/db/schema";
import { applyTaskMove, hitTestColumn, shouldActivateDrag, type DropTarget } from "@/lib/kanban-dnd";

export type DragVisual = {
  taskId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  over: DropTarget | null;
};

type PointerSession = {
  pointerId: number;
  taskId: string;
  originX: number;
  originY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export function useKanbanPointerDnd(projectId: string, initialTasks: Task[]) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [drag, setDrag] = useState<DragVisual | null>(null);

  const sessionRef = useRef<PointerSession | null>(null);
  const dragRef = useRef<DragVisual | null>(null);
  const tasksRef = useRef(tasks);
  const suppressClickRef = useRef<string | null>(null);
  const persistRef = useRef<(taskId: string, over: DropTarget | null) => void>(() => {});

  tasksRef.current = tasks;

  useEffect(() => {
    if (dragRef.current) return;
    setTasks(initialTasks);
  }, [initialTasks]);

  persistRef.current = (taskId, over) => {
    if (!over) return;
    const current = tasksRef.current;
    const task = current.find((item) => item.id === taskId);
    if (!task) return;

    const dest = current
      .filter((item) => item.statusColumnId === over.columnId && item.id !== taskId)
      .sort((a, b) => a.orderInColumn - b.orderInColumn);
    const index = Math.max(0, Math.min(over.index, dest.length));
    const currentIndex = current
      .filter((item) => item.statusColumnId === task.statusColumnId)
      .sort((a, b) => a.orderInColumn - b.orderInColumn)
      .findIndex((item) => item.id === taskId);

    if (task.statusColumnId === over.columnId && currentIndex === index) return;

    const snapshot = current;
    const next = applyTaskMove(current, taskId, over.columnId, index);
    tasksRef.current = next;
    setTasks(next);

    void (async () => {
      try {
        const response = await fetch(`/api/kanban/${projectId}/tasks/${taskId}/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ columnId: over.columnId, orderInColumn: index }),
        });
        if (!response.ok) throw new Error("move failed");
        router.refresh();
      } catch (error) {
        console.error("Error moving task:", error);
        tasksRef.current = snapshot;
        setTasks(snapshot);
      }
    })();
  };

  const onCardPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>, taskId: string) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) return;

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    sessionRef.current = {
      pointerId: event.pointerId,
      taskId,
      originX: event.clientX,
      originY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  useEffect(() => {
    const activate = (session: PointerSession, event: PointerEvent): DragVisual => {
      const over = hitTestColumn(event.clientX, event.clientY, session.taskId);
      return {
        taskId: session.taskId,
        x: event.clientX,
        y: event.clientY,
        width: session.width,
        height: session.height,
        offsetX: session.offsetX,
        offsetY: session.offsetY,
        over,
      };
    };

    const onMove = (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;

      const active = dragRef.current;
      if (!active) {
        if (!shouldActivateDrag(session.originX, session.originY, event.clientX, event.clientY)) return;
        event.preventDefault();
        const next = activate(session, event);
        dragRef.current = next;
        setDrag(next);
        return;
      }

      event.preventDefault();
      const over = hitTestColumn(event.clientX, event.clientY, session.taskId);
      const next: DragVisual = {
        ...active,
        x: event.clientX,
        y: event.clientY,
        over,
      };
      dragRef.current = next;
      setDrag(next);
    };

    const onUp = (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;
      sessionRef.current = null;

      const active = dragRef.current;
      if (!active) return;

      event.preventDefault();
      suppressClickRef.current = session.taskId;
      dragRef.current = null;
      setDrag(null);
      persistRef.current(session.taskId, active.over);
    };

    window.addEventListener("pointermove", onMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onUp, { capture: true });
    window.addEventListener("pointercancel", onUp, { capture: true });
    return () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
    };
  }, []);

  const shouldIgnoreClick = useCallback((taskId: string) => {
    if (suppressClickRef.current === taskId) {
      suppressClickRef.current = null;
      return true;
    }
    return Boolean(dragRef.current);
  }, []);

  return { tasks, drag, onCardPointerDown, shouldIgnoreClick };
}
