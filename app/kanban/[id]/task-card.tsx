"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Flag, User } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import type { Task } from "@/lib/db/schema";

interface TaskCardProps {
  task: Task;
  projectId: string;
  isDragging: boolean;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onTouchDrop: (clientX: number, clientY: number) => void;
}

const priorityColors: Record<string, string> = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
};

export function TaskCard({ task, projectId, isDragging, onDragStart, onDragEnd, onTouchDrop }: TaskCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || !touchStartRef.current) return;
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      if (!draggingRef.current && (dx > 10 || dy > 10)) {
        draggingRef.current = true;
        didDragRef.current = true;
        onDragStart(task.id);
      }
      if (draggingRef.current) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current && !draggingRef.current) return;
      const touch = e.changedTouches[0];
      if (draggingRef.current && touch) {
        onTouchDrop(touch.clientX, touch.clientY);
      }
      draggingRef.current = false;
      touchStartRef.current = null;
      onDragEnd();
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [onDragEnd, onDragStart, onTouchDrop, task.id]);

  return (
    <>
      <Card
        ref={cardRef}
        draggable
        data-task-id={task.id}
        onDragStart={() => {
          didDragRef.current = true;
          onDragStart(task.id);
        }}
        onDragEnd={onDragEnd}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (!touch) return;
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
          didDragRef.current = false;
        }}
        onClick={() => {
          if (didDragRef.current) {
            didDragRef.current = false;
            return;
          }
          setShowDialog(true);
        }}
        className={`bg-white cursor-pointer hover:border-accent transition-colors ${isDragging ? "opacity-40 pointer-events-none" : ""}`}
        style={{ touchAction: "none" }}
      >
        <CardContent className="p-3 space-y-2">
          <h4 className="font-medium text-sm">{task.title}</h4>
          {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assignee}
              </div>
            )}
            {(task.startDate || task.dueDate) && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {task.startDate && new Date(task.startDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                {task.startDate && task.dueDate && " – "}
                {task.dueDate && new Date(task.dueDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </div>
            )}
            {task.taskType && task.taskType !== "task" && (
              <Flag className={`h-3 w-3 ${priorityColors[task.taskType] || ""}`} />
            )}
          </div>
        </CardContent>
      </Card>

      <TaskDialog open={showDialog} onOpenChange={setShowDialog} projectId={projectId} task={task} />
    </>
  );
}
