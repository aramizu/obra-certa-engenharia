"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Task } from "@/lib/db/schema";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  columnId?: string;
  task?: Task;
}

export function TaskDialog({ open, onOpenChange, projectId, columnId, task }: TaskDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      taskType: formData.get("taskType") as string || "task",
      dueDate: formData.get("dueDate") as string || null,
      columnId: columnId || task?.statusColumnId || null,
    };

    try {
      const url = task ? `/api/kanban/${projectId}/tasks/${task.id}` : `/api/kanban/${projectId}/tasks`;
      await fetch(url, {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      onOpenChange(false);
      router.refresh();
    } catch {
      alert("Erro ao salvar tarefa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
            <DialogDescription>Preencha as informações da tarefa</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" defaultValue={task?.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea id="description" name="description" defaultValue={task?.description || ""} className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taskType">Prioridade</Label>
                <select id="taskType" name="taskType" defaultValue={task?.taskType || "task"} className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background">
                  <option value="task">Normal</option>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Prazo</Label>
                <Input id="dueDate" name="dueDate" type="date" defaultValue={task?.dueDate || ""} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
