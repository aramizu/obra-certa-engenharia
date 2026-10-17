"use client";

import { useState, type PointerEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Diamond, Flag, User } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import type { Task } from "@/lib/db/schema";

interface TaskCardProps {
  task: Task;
  projectId: string;
  isDragging: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>, taskId: string) => void;
  shouldIgnoreClick: (taskId: string) => boolean;
}

const priorityColors: Record<string, string> = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
};

export function TaskCardBody({ task }: { task: Task }) {
  return (
    <CardContent className="p-3 space-y-2">
      <h4 className="font-medium text-sm flex items-center gap-1.5">
        {task.isMilestone && <Diamond className="h-3 w-3 text-orange-500 shrink-0" />}
        {task.title}
      </h4>
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
        {!task.isMilestone && task.taskType && task.taskType !== "task" && (
          <Flag className={`h-3 w-3 ${priorityColors[task.taskType] || ""}`} />
        )}
      </div>
    </CardContent>
  );
}

export function TaskCard({ task, projectId, isDragging, onPointerDown, shouldIgnoreClick }: TaskCardProps) {
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
        className={`bg-white cursor-grab hover:border-orange-400 transition-colors select-none ${
          isDragging ? "opacity-40 cursor-grabbing" : ""
        }`}
        style={{ touchAction: "none" }}
      >
        <TaskCardBody task={task} />
      </Card>

      <TaskDialog open={showDialog} onOpenChange={setShowDialog} projectId={projectId} task={task} />
    </>
  );
}
