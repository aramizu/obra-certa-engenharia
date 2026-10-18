"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, Textarea } from "@/components/ds";
import type { Task } from "@/lib/db/schema";
import { afterMutation } from "@/lib/after-mutation";
import { TaskColorPicker } from "@/components/task-color-picker";
import { DEFAULT_TASK_COLOR, resolveTaskColorId, type TaskColorId } from "@/lib/task-color";
import { SEM_OBRA_LABEL } from "@/lib/user-tasks";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
  projects?: { id: string; name: string }[];
  columnId?: string;
  task?: Task;
  defaultStartDate?: string;
  defaultDueDate?: string;
}

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  projects = [],
  columnId,
  task,
  defaultStartDate,
  defaultDueDate,
}: TaskDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState<TaskColorId>(DEFAULT_TASK_COLOR);

  useEffect(() => {
    if (!open) return;
    setColor(resolveTaskColorId(task?.color));
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const selectedProjectId = (formData.get("projectId") as string | null)?.trim() || null;
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      assignee: formData.get("assignee") as string || null,
      taskType: formData.get("taskType") as string || "task",
      startDate: formData.get("startDate") as string || null,
      dueDate: formData.get("dueDate") as string || null,
      columnId: columnId || task?.statusColumnId || null,
      projectId: selectedProjectId,
      color,
    };

    try {
      const url = task ? `/api/kanban/tasks/${task.id}` : "/api/kanban/tasks";
      const response = await fetch(url, {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "Erro ao salvar tarefa");
      }
      onOpenChange(false);
      await afterMutation(() => router.refresh(), { projectId: selectedProjectId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar tarefa");
    } finally {
      setLoading(false);
    }
  };

  const defaultObra = task?.projectId || projectId || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={handleSubmit}
          key={`${task?.id ?? "new"}-${defaultDueDate ?? ""}-${projectId ?? ""}`}
        >
          <DialogHeader>
            <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
            <DialogDescription>Preencha as informações da tarefa</DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="projectId">Obra</Label>
              <Select
                id="projectId"
                name="projectId"
                defaultValue={defaultObra}
                className="bg-white"
              >
                <option value="">{SEM_OBRA_LABEL}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" defaultValue={task?.title} required className="bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={task?.description || ""}
                className="min-h-[64px]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="assignee">Responsável</Label>
                <Input id="assignee" name="assignee" defaultValue={task?.assignee || ""} placeholder="Opcional" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taskType">Prioridade</Label>
                <Select
                  id="taskType"
                  name="taskType"
                  defaultValue={task?.taskType || "task"}
                >
                  <option value="task">Normal</option>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Cor</Label>
                <TaskColorPicker value={color} onChange={setColor} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Início</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={task?.startDate || defaultStartDate || ""}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Prazo</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  defaultValue={task?.dueDate || defaultDueDate || ""}
                  className="bg-white"
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
