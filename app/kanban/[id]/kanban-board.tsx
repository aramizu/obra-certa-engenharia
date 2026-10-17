"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanColumn } from "./kanban-column";
import { TaskDialog } from "./task-dialog";
import { ColumnDialog } from "./column-dialog";
import type { TaskColumn, Task } from "@/lib/db/schema";

interface KanbanBoardProps {
  projectId: string;
  initialColumns: TaskColumn[];
  initialTasks: Task[];
}

export function KanbanBoard({ projectId, initialColumns, initialTasks }: KanbanBoardProps) {
  const router = useRouter();
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = async (columnId: string | null) => {
    if (!draggedTask) return;

    const task = initialTasks.find(t => t.id === draggedTask);
    if (!task || task.statusColumnId === columnId) return;

    try {
      await fetch(`/api/kanban/${projectId}/tasks/${draggedTask}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error moving task:", error);
    }
  };

  return (
    <>
      <div className="flex gap-4 h-full min-w-max pb-4">
        {initialColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={initialTasks.filter(t => t.statusColumnId === column.id)}
            projectId={projectId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ))}
        
        <div className="flex-shrink-0 w-80">
          <Button
            variant="outline"
            className="w-full h-12 border-dashed"
            onClick={() => setShowColumnDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Coluna
          </Button>
        </div>
      </div>

      <ColumnDialog
        open={showColumnDialog}
        onOpenChange={setShowColumnDialog}
        projectId={projectId}
      />
    </>
  );
}
