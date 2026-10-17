"use client";

import { useState, useRef } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const priorityColors: Record<string, string> = {
    high: "text-red-500",
    medium: "text-yellow-500",
    low: "text-blue-500",
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);
    
    if (dx > 10 || dy > 10) {
      setIsDragging(true);
      onDragStart(task.id);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      onDragEnd();
      setIsDragging(false);
    } else if (touchStartRef.current && Date.now() - touchStartRef.current.time < 300) {
      setShowDialog(true);
    }
    touchStartRef.current = null;
  };

  return (
    <>
      <Card
        draggable
        onDragStart={() => onDragStart(task.id)}
        onDragEnd={onDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (!isDragging && e.type === 'click') setShowDialog(true);
        }}
        className={`cursor-pointer hover:border-accent transition-colors ${isDragging ? 'opacity-50' : ''}`}
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
