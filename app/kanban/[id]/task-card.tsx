"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Flag } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import type { Task } from "@/lib/db/schema";

interface TaskCardProps {
  task: Task;
  projectId: string;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}

export function TaskCard({ task, projectId, onDragStart, onDragEnd }: TaskCardProps) {
  const [showDialog, setShowDialog] = useState(false);

  const priorityColors: Record<string, string> = {
    high: "text-red-500",
    medium: "text-yellow-500",
    low: "text-blue-500",
  };

  return (
    <>
      <Card
        draggable
        onDragStart={() => onDragStart(task.id)}
        onDragEnd={onDragEnd}
        onClick={() => setShowDialog(true)}
        className="cursor-pointer hover:border-accent transition-colors"
      >
        <CardContent className="p-3 space-y-2">
          <h4 className="font-medium text-sm">{task.title}</h4>
          {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
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
