"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanColumn } from "./kanban-column";
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

  const resolveDropIndex = (columnId: string, clientY: number) => {
    const columnEl = document.querySelector(`[data-column-id="${columnId}"]`);
    if (!columnEl) return initialTasks.filter((task) => task.statusColumnId === columnId && task.id !== draggedTask).length;

    const cards = Array.from(columnEl.querySelectorAll<HTMLElement>("[data-task-id]"))
      .filter((card) => card.dataset.taskId !== draggedTask);

    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }

    return cards.length;
  };

  const handleDrop = async (columnId: string, clientY?: number) => {
    if (!draggedTask) return;

    const task = initialTasks.find((item) => item.id === draggedTask);
    if (!task) return;

    const destTasks = initialTasks
      .filter((item) => item.statusColumnId === columnId && item.id !== draggedTask)
      .sort((a, b) => a.orderInColumn - b.orderInColumn);

    const orderInColumn = typeof clientY === "number" ? resolveDropIndex(columnId, clientY) : destTasks.length;
    const currentIndex = initialTasks
      .filter((item) => item.statusColumnId === task.statusColumnId)
      .sort((a, b) => a.orderInColumn - b.orderInColumn)
      .findIndex((item) => item.id === draggedTask);

    if (task.statusColumnId === columnId && currentIndex === orderInColumn) {
      setDraggedTask(null);
      return;
    }

    try {
      await fetch(`/api/kanban/${projectId}/tasks/${draggedTask}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId, orderInColumn }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error moving task:", error);
    } finally {
      setDraggedTask(null);
    }
  };

  const handleTouchDrop = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const column = el?.closest<HTMLElement>("[data-column-id]");
    if (!column?.dataset.columnId) {
      setDraggedTask(null);
      return;
    }
    void handleDrop(column.dataset.columnId, clientY);
  };

  return (
    <>
      <div className="flex gap-4 h-full min-w-max pb-4">
        {initialColumns.map((column, index) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={initialTasks
              .filter((task) => task.statusColumnId === column.id)
              .sort((a, b) => a.orderInColumn - b.orderInColumn)}
            projectId={projectId}
            canDelete={initialColumns.length > 1}
            canMoveLeft={index > 0}
            canMoveRight={index < initialColumns.length - 1}
            draggedTaskId={draggedTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onTouchDrop={handleTouchDrop}
          />
        ))}

        <div className="flex-shrink-0 w-80">
          <Button
            variant="outline"
            className="w-full h-12 border-dashed bg-white"
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
