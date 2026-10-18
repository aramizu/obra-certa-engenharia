"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveRestore, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { afterMutation } from "@/lib/after-mutation";
import type { Project } from "@/lib/db/schema";

export function ArchivedProjectsSection({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  if (projects.length === 0) return null;

  const setArchived = async (project: Project, archived: boolean) => {
    setPendingId(project.id);
    try {
      const response = await fetch(`/api/obras/${project.id}/arquivo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar arquivo");
      await afterMutation(() => router.refresh(), { projectId: project.id });
    } catch (error) {
      console.error("Error updating archive:", error);
      alert(archived ? "Erro ao arquivar obra" : "Erro ao desarquivar obra");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setPendingId(deleteTarget.id);
    try {
      const response = await fetch(`/api/obras/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir obra");
      await afterMutation(() => router.refresh(), { projectId: deleteTarget.id });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Erro ao excluir obra");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="space-y-3">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border-2 border-graphite bg-white px-4 py-3 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium">
          Obras arquivadas ({projects.length})
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-2">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/obras/${project.id}`} prefetch className="font-medium hover:underline">
                  {project.name}
                </Link>
                {project.address && (
                  <p className="text-xs text-muted-foreground truncate">{project.address}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pendingId === project.id}
                  onClick={() => void setArchived(project, false)}
                >
                  <ArchiveRestore className="h-4 w-4 mr-1" />
                  Desarquivar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={pendingId === project.id}
                  onClick={() => setDeleteTarget(project)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !pendingId && setDeleteTarget(null)} />
          <div className="relative z-50 w-full max-w-md overflow-hidden rounded-lg bg-white text-foreground border-2 border-graphite ds-shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja excluir a obra <strong>{deleteTarget.name}</strong>? Tarefas,
              materiais, categorias, colunas do Kanban, marcos e a lista sugerida desta obra também
              saem. Arquivar não apaga; excluir não pode ser desfeito.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={Boolean(pendingId)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => void handleDelete()} disabled={Boolean(pendingId)}>
                {pendingId === deleteTarget.id ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
