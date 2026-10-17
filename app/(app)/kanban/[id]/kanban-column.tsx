"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";
import { ColumnDialog } from "./column-dialog";
import type { TaskColumn, Task } from "@/lib/db/schema";

interface KanbanColumnProps {
  column: TaskColumn;
  tasks: Task[];
  projectId: string;
  canDelete: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  draggedTaskId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDrop: (columnId: string, clientY?: number) => void;
  onTouchDrop: (clientX: number, clientY: number) => void;
}

export function KanbanColumn({
  column,
  tasks,
  projectId,
  canDelete,
  canMoveLeft,
  canMoveRight,
  draggedTaskId,
  onDragStart,
  onDragEnd,
  onDrop,
  onTouchDrop,
}: KanbanColumnProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/kanban/${projectId}/columns/${column.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao excluir coluna");
      }
      setShowDeleteConfirm(false);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao excluir coluna");
    } finally {
      setLoading(false);
    }
  };

  const moveColumn = async (direction: "left" | "right") => {
    setShowMenu(false);
    await fetch(`/api/kanban/${projectId}/columns/${column.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    router.refresh();
  };

  return (
    <>
      <div
        data-column-id={column.id}
        className={`flex-shrink-0 w-80 flex flex-col max-h-full rounded-lg bg-white border p-3 ${dragOver ? "ring-2 ring-accent" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onDrop(column.id, e.clientY);
        }}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-sm uppercase tracking-wide truncate">{column.name}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
              {tasks.length}
            </span>
          </div>
          <div className="relative shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} aria-label="Opções da coluna">
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10 lg:left-64" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white text-foreground border rounded-lg shadow-lg z-20 py-1">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"
                    disabled={!canMoveLeft}
                    onClick={() => moveColumn("left")}
                  >
                    <ChevronLeft className="h-3 w-3" />Mover para esquerda
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"
                    disabled={!canMoveRight}
                    onClick={() => moveColumn("right")}
                  >
                    <ChevronRight className="h-3 w-3" />Mover para direita
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setShowMenu(false);
                      setShowEditDialog(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />Renomear
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
                    disabled={!canDelete}
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px]">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectId={projectId}
              isDragging={draggedTaskId === task.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onTouchDrop={onTouchDrop}
            />
          ))}
        </div>

        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start text-muted-foreground" onClick={() => setShowTaskDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />Nova Tarefa
        </Button>
      </div>

      <TaskDialog open={showTaskDialog} onOpenChange={setShowTaskDialog} projectId={projectId} columnId={column.id} />
      <ColumnDialog open={showEditDialog} onOpenChange={setShowEditDialog} projectId={projectId} column={column} />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !loading && setShowDeleteConfirm(false)} />
          <div className="relative z-50 w-full max-w-md bg-white text-foreground border rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Excluir Coluna</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza? As tarefas desta raia ficam sem coluna até você movê-las de novo.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={loading}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? "Excluindo..." : "Excluir"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
