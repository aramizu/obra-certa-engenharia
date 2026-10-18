"use client";

import { useState, type PointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TaskCard, type TaskWithObra } from "./task-card";
import { TaskDialog } from "./task-dialog";
import { ColumnDialog } from "./column-dialog";
import type { TaskColumn } from "@/lib/db/schema";
import type { DropTarget } from "@/lib/kanban-dnd";
import { afterMutation } from "@/lib/after-mutation";
import { chipContrastStyle } from "@/components/ds";

interface KanbanColumnProps {
  column: TaskColumn;
  tasks: TaskWithObra[];
  projects: { id: string; name: string }[];
  defaultProjectId?: string | null;
  canDelete: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  draggedTaskId: string | null;
  dropTarget: DropTarget | null;
  placeholderHeight: number;
  onCardPointerDown: (event: PointerEvent<HTMLElement>, taskId: string) => void;
  shouldIgnoreClick: (taskId: string) => boolean;
}

function DropPlaceholder({ height }: { height: number }) {
  return (
    <div
      data-drop-placeholder
      className="rounded-lg border-2 border-dashed border-primary bg-signal-wash"
      style={{ height: Math.max(height, 48) }}
    />
  );
}

export function KanbanColumn({
  column,
  tasks,
  projects,
  defaultProjectId,
  canDelete,
  canMoveLeft,
  canMoveRight,
  draggedTaskId,
  dropTarget,
  placeholderHeight,
  onCardPointerDown,
  shouldIgnoreClick,
}: KanbanColumnProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOver = dropTarget?.columnId === column.id;
  const placeholderIndex = isOver ? dropTarget.index : -1;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/kanban/columns/${column.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao excluir coluna");
      }
      setShowDeleteConfirm(false);
      await afterMutation(() => router.refresh());
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao excluir coluna");
    } finally {
      setLoading(false);
    }
  };

  const moveColumn = async (direction: "left" | "right") => {
    setShowMenu(false);
    await fetch(`/api/kanban/columns/${column.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    await afterMutation(() => router.refresh());
  };

  const cards: ReactNode[] = [];
  tasks.forEach((task, index) => {
    if (placeholderIndex === index) {
      cards.push(<DropPlaceholder key="drop-placeholder" height={placeholderHeight} />);
    }
    cards.push(
      <TaskCard
        key={task.id}
        task={task}
        projects={projects}
        isDragging={draggedTaskId === task.id}
        onPointerDown={onCardPointerDown}
        shouldIgnoreClick={shouldIgnoreClick}
      />
    );
  });
  if (placeholderIndex >= tasks.length) {
    cards.push(<DropPlaceholder key="drop-placeholder" height={placeholderHeight} />);
  }

  return (
    <>
      <div
        data-column-id={column.id}
        className={`flex-shrink-0 w-80 flex flex-col max-h-full rounded-lg bg-white border-2 border-graphite ${
          isOver ? "ring-2 ring-primary bg-signal-wash" : ""
        }`}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-sm uppercase tracking-wide truncate">{column.name}</h3>
            <span className="ds-chip-surface ds-chip-pill text-[10px] font-mono px-2 py-0.5 shrink-0" data-fill="concrete" style={chipContrastStyle("concrete")}>
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
                <div className="absolute right-0 mt-1 w-48 overflow-hidden rounded-lg bg-white border-2 border-graphite ds-shadow z-20 py-1">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-concrete disabled:opacity-40"
                    disabled={!canMoveLeft}
                    onClick={() => moveColumn("left")}
                  >
                    <ChevronLeft className="h-3 w-3" />Mover para esquerda
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-concrete disabled:opacity-40"
                    disabled={!canMoveRight}
                    onClick={() => moveColumn("right")}
                  >
                    <ChevronRight className="h-3 w-3" />Mover para direita
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-concrete"
                    onClick={() => {
                      setShowMenu(false);
                      setShowEditDialog(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />Renomear
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-delay hover:bg-delay-wash disabled:opacity-40"
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

        {/* Padding no scroller (não no wrapper) para a sombra 4px dos cards não ser cortada. */}
        <div className="flex-1 min-h-[12rem] min-w-0 overflow-y-auto overflow-x-hidden">
          <div className="space-y-2 px-3 py-1.5">
            {cards}
          </div>
        </div>

        <div className="px-3 pb-3 pt-1">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setShowTaskDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />Nova Tarefa
          </Button>
        </div>
      </div>

      <TaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        projectId={defaultProjectId}
        projects={projects}
        columnId={column.id}
      />
      <ColumnDialog open={showEditDialog} onOpenChange={setShowEditDialog} column={column} />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir Coluna"
        description="Tem certeza? As tarefas desta raia ficam sem coluna até você movê-las de novo."
        loading={loading}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
