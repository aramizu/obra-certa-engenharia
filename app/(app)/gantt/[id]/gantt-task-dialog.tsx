"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ds";
import type { Task, TaskDependency } from "@/lib/db/schema";
import { dependencyConflict } from "@/lib/gantt";
import { afterMutation } from "@/lib/after-mutation";
import { TaskColorPicker } from "@/components/task-color-picker";
import { DEFAULT_TASK_COLOR, resolveTaskColorId, type TaskColorId } from "@/lib/task-color";
import { SEM_OBRA_LABEL } from "@/lib/user-tasks";

interface GanttTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string | null;
  projects?: { id: string; name: string }[];
  task?: Task | null;
  tasks: Task[];
  dependencies: TaskDependency[];
}

export function GanttTaskDialog({
  open,
  onOpenChange,
  defaultProjectId,
  projects = [],
  task,
  tasks,
  dependencies,
}: GanttTaskDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
  const [color, setColor] = useState<TaskColorId>(DEFAULT_TASK_COLOR);

  const currentDeps = useMemo(
    () => (task ? dependencies.filter((dep) => dep.taskId === task.id) : []),
    [dependencies, task]
  );

  useEffect(() => {
    if (!open) return;
    setPredecessorIds(task ? currentDeps.map((dep) => dep.dependsOnTaskId) : []);
    setColor(resolveTaskColorId(task?.color));
  }, [open, task, currentDeps]);

  const otherTasks = tasks.filter((item) => item.id !== task?.id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const selectedProjectId = (formData.get("projectId") as string | null)?.trim() || null;
    const payload = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      assignee: (formData.get("assignee") as string) || null,
      color,
      projectId: selectedProjectId,
      startDate: (formData.get("startDate") as string) || null,
      dueDate: (formData.get("dueDate") as string) || null,
    };

    try {
      const url = task ? `/api/gantt/tasks/${task.id}` : "/api/gantt/tasks";
      const response = await fetch(url, {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Erro ao salvar");

      const savedId: string = task?.id ?? body.task.id;
      const existingPred = new Set(currentDeps.map((dep) => dep.dependsOnTaskId));
      const nextPred = new Set(predecessorIds);

      for (const dep of currentDeps) {
        if (!nextPred.has(dep.dependsOnTaskId)) {
          await fetch(`/api/gantt/dependencies/${dep.id}`, { method: "DELETE" });
        }
      }
      for (const dependsOnTaskId of nextPred) {
        if (!existingPred.has(dependsOnTaskId) || !task) {
          const depRes = await fetch("/api/gantt/dependencies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: savedId, dependsOnTaskId }),
          });
          if (!depRes.ok) {
            const depBody = await depRes.json().catch(() => ({}));
            throw new Error(depBody.error || "Erro ao salvar dependência");
          }
        }
      }

      onOpenChange(false);
      await afterMutation(() => router.refresh(), { projectId: selectedProjectId });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar tarefa");
    } finally {
      setLoading(false);
    }
  };

  const warnings = predecessorIds.flatMap((predId) => {
    const pred = tasks.find((item) => item.id === predId);
    if (!pred) return [];
    const draft = {
      startDate: task?.startDate ?? null,
      dueDate: task?.dueDate ?? null,
      endDate: task?.endDate ?? null,
    };
    if (!dependencyConflict(draft, pred)) return [];
    return [pred.title];
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} key={task?.id ?? "task"}>
          <DialogHeader>
            <DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
            <DialogDescription>As datas alimentam o Gantt, o Kanban e o calendário.</DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="gantt-obra">Obra</Label>
              <Select
                id="gantt-obra"
                name="projectId"
                defaultValue={task?.projectId || defaultProjectId || ""}
                className="bg-white"
              >
                <option value="">{SEM_OBRA_LABEL}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gantt-title">Título *</Label>
              <Input id="gantt-title" name="title" defaultValue={task?.title} required className="bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gantt-description">Descrição</Label>
              <textarea
                id="gantt-description"
                name="description"
                defaultValue={task?.description || ""}
                className="w-full min-h-[64px] rounded-md px-3 py-2 text-sm border-2 border-graphite bg-white"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Cor</Label>
                <TaskColorPicker value={color} onChange={setColor} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gantt-assignee">Responsável</Label>
                <Input id="gantt-assignee" name="assignee" defaultValue={task?.assignee || ""} className="bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gantt-start">Início</Label>
                <Input id="gantt-start" name="startDate" type="date" defaultValue={task?.startDate || ""} className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gantt-due">Prazo</Label>
                <Input id="gantt-due" name="dueDate" type="date" defaultValue={task?.dueDate || ""} className="bg-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Predecessores (término → início)</Label>
              {otherTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">Cadastre outras tarefas para ligar dependências.</p>
              ) : (
                <div className="max-h-32 overflow-y-auto rounded-md border-2 border-graphite bg-white p-2 space-y-1">
                  {otherTasks.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={predecessorIds.includes(item.id)}
                        onChange={(e) => {
                          setPredecessorIds((current) =>
                            e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)
                          );
                        }}
                      />
                      <span className="truncate">{item.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {warnings.length > 0 && (
              <p className="text-sm text-destructive">
                Atenção: esta tarefa começa antes do término de {warnings.join(", ")}.
              </p>
            )}
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
