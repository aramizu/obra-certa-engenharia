"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Task, TaskDependency } from "@/lib/db/schema";
import { dependencyConflict, isMilestoneTask } from "@/lib/gantt";
import { afterMutation } from "@/lib/after-mutation";
import { TaskColorPicker } from "@/components/task-color-picker";
import { DEFAULT_TASK_COLOR, resolveTaskColorId, type TaskColorId } from "@/lib/task-color";

interface GanttTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: Task | null;
  createMilestone?: boolean;
  tasks: Task[];
  dependencies: TaskDependency[];
}

export function GanttTaskDialog({
  open,
  onOpenChange,
  projectId,
  task,
  createMilestone = false,
  tasks,
  dependencies,
}: GanttTaskDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isMilestone, setIsMilestone] = useState(false);
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
  const [color, setColor] = useState<TaskColorId>(DEFAULT_TASK_COLOR);

  const currentDeps = useMemo(
    () => (task ? dependencies.filter((dep) => dep.taskId === task.id) : []),
    [dependencies, task]
  );

  useEffect(() => {
    if (!open) return;
    setIsMilestone(task ? isMilestoneTask(task) : createMilestone);
    setPredecessorIds(task ? currentDeps.map((dep) => dep.dependsOnTaskId) : []);
    setColor(resolveTaskColorId(task?.color));
  }, [open, task, createMilestone, currentDeps]);

  const otherTasks = tasks.filter((item) => item.id !== task?.id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      assignee: (formData.get("assignee") as string) || null,
      isMilestone,
      color,
      startDate: (formData.get("startDate") as string) || null,
      dueDate: isMilestone
        ? (formData.get("startDate") as string) || (formData.get("dueDate") as string) || null
        : (formData.get("dueDate") as string) || null,
    };

    try {
      const url = task ? `/api/gantt/${projectId}/tasks/${task.id}` : `/api/gantt/${projectId}/tasks`;
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
          await fetch(`/api/gantt/${projectId}/dependencies/${dep.id}`, { method: "DELETE" });
        }
      }
      for (const dependsOnTaskId of nextPred) {
        if (!existingPred.has(dependsOnTaskId) || !task) {
          const depRes = await fetch(`/api/gantt/${projectId}/dependencies`, {
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
      await afterMutation(() => router.refresh(), { projectId });
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
      isMilestone,
      taskType: task?.taskType ?? "task",
    };
    if (!dependencyConflict(draft, pred)) return [];
    return [pred.title];
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} key={task?.id ?? (createMilestone ? "milestone" : "task")}>
          <DialogHeader>
            <DialogTitle>{task ? "Editar tarefa" : isMilestone ? "Novo marco" : "Nova tarefa"}</DialogTitle>
            <DialogDescription>As datas alimentam o Gantt e o Kanban da mesma obra.</DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3 py-3">
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
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={isMilestone}
                  onChange={(e) => setIsMilestone(e.target.checked)}
                />
                Marco de entrega (sem duração, losango no Gantt)
              </label>
            </div>

            {isMilestone ? (
              <div className="space-y-1.5">
                <Label htmlFor="gantt-start">Data do marco</Label>
                <Input id="gantt-start" name="startDate" type="date" defaultValue={task?.startDate || task?.dueDate || ""} className="bg-white" />
              </div>
            ) : (
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
            )}

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
