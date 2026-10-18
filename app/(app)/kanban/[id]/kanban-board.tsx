"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KanbanColumn } from "./kanban-column";
import { ColumnDialog } from "./column-dialog";
import { TaskCardBody } from "./task-card";
import { useKanbanPointerDnd } from "./use-kanban-pointer-dnd";
import type { TaskColumn, Task } from "@/lib/db/schema";

interface KanbanBoardProps {
  projectId: string;
  initialColumns: TaskColumn[];
  initialTasks: Task[];
}

export function KanbanBoard({ projectId, initialColumns, initialTasks }: KanbanBoardProps) {
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const { tasks, drag, onCardPointerDown, shouldIgnoreClick } = useKanbanPointerDnd(projectId, initialTasks);
  const draggedTask = drag ? tasks.find((task) => task.id === drag.taskId) : null;

  return (
    <>
      <div className={`flex gap-4 h-full min-w-max pb-4 ${drag ? "select-none cursor-grabbing" : ""}`}>
        {initialColumns.map((column, index) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks
              .filter((task) => task.statusColumnId === column.id)
              .sort((a, b) => a.orderInColumn - b.orderInColumn)}
            projectId={projectId}
            canDelete={initialColumns.length > 1}
            canMoveLeft={index > 0}
            canMoveRight={index < initialColumns.length - 1}
            draggedTaskId={drag?.taskId ?? null}
            dropTarget={drag?.over ?? null}
            placeholderHeight={drag?.height ?? 72}
            onCardPointerDown={onCardPointerDown}
            shouldIgnoreClick={shouldIgnoreClick}
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

      {drag &&
        draggedTask &&
        createPortal(
          <div
            aria-hidden
            className="fixed z-50 pointer-events-none p-1.5"
            style={{
              left: drag.x - drag.offsetX - 6,
              top: drag.y - drag.offsetY - 6,
              width: drag.width + 12,
              transform: "rotate(2deg)",
            }}
          >
            <Card className="bg-white ds-shadow border-primary opacity-95">
              <TaskCardBody task={draggedTask} />
            </Card>
          </div>,
          document.body
        )}

      <ColumnDialog
        open={showColumnDialog}
        onOpenChange={setShowColumnDialog}
        projectId={projectId}
      />
    </>
  );
}
