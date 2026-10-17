"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";
import { ColumnDialog } from "./column-dialog";
import type { TaskColumn, Task } from "@/lib/db/schema";

interface KanbanColumnProps {
  column: TaskColumn;
  tasks: Task[];
  projectId: string;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDrop: (columnId: string | null) => void;
}

export function KanbanColumn({ column, tasks, projectId, onDragStart, onDragEnd, onDrop }: KanbanColumnProps) {
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
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Erro ao excluir coluna");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`flex-shrink-0 w-80 flex flex-col max-h-full ${dragOver ? "opacity-50" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={() => { setDragOver(false); onDrop(column.id); }}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm uppercase tracking-wide">{column.name}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg z-20">
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted" onClick={() => { setShowMenu(false); setShowEditDialog(true); }}>
                    <Pencil className="h-3 w-3" />Renomear
                  </button>
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10" onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}>
                    <Trash2 className="h-3 w-3" />Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px]">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} projectId={projectId} onDragStart={onDragStart} onDragEnd={onDragEnd} />
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
          <div className="relative z-50 w-full max-w-md bg-white border rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Excluir Coluna</h3>
            <p className="text-sm text-muted-foreground mb-6">Tem certeza? As tarefas serão desvinculadas.</p>
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
