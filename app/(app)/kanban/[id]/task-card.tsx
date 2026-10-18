"use client";

import { useState, type PointerEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Flag, User } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import type { Task } from "@/lib/db/schema";
import { taskColorStyle } from "@/lib/task-color";
import { chipContrastStyle, cn } from "@/components/ds";
import { obraLabel } from "@/lib/user-tasks";

export type TaskWithObra = Task & { projectName: string | null };

interface TaskCardProps {
  task: TaskWithObra;
  projects: { id: string; name: string }[];
  isDragging: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>, taskId: string) => void;
  shouldIgnoreClick: (taskId: string) => boolean;
}

const priorityColors: Record<string, string> = {
  high: "text-delay",
  medium: "text-signal-ink",
  low: "text-blueprint",
};

export function TaskCardBody({ task }: { task: TaskWithObra }) {
  return (
    <CardContent className="p-3 space-y-2">
      <h4 className="font-medium text-sm flex items-center gap-1.5">
        {task.title}
      </h4>
      <span
        className="ds-chip-surface ds-chip-pill inline-flex text-[10px] font-display uppercase tracking-wide px-2 py-0.5"
        data-fill="concrete"
        style={chipContrastStyle("concrete")}
      >
        {obraLabel(task.projectName)}
      </span>
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
  );
}

export function TaskCard({ task, projects, isDragging, onPointerDown, shouldIgnoreClick }: TaskCardProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Card
        data-task-id={task.id}
        onPointerDown={(event) => onPointerDown(event, task.id)}
        onDragStart={(event) => event.preventDefault()}
        onClick={() => {
          if (shouldIgnoreClick(task.id)) return;
          setShowDialog(true);
        }}
        className={cn(
          "relative cursor-grab hover:border-primary select-none",
          isDragging ? "opacity-40 cursor-grabbing" : ""
        )}
        style={{ touchAction: "none" }}
      >
        <span
          aria-hidden
          className={cn("absolute left-0 top-0 bottom-0 w-1.5", taskColorStyle(task.color).accent)}
        />
        <TaskCardBody task={task} />
      </Card>

      <TaskDialog open={showDialog} onOpenChange={setShowDialog} projects={projects} task={task} />
    </>
  );
}
