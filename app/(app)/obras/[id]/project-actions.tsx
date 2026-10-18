"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ProjectDialog } from "../project-dialog";
import type { Project } from "@/lib/db/schema";
import { formatProjectDeleteWarning } from "@/lib/domain-data";
import { afterMutation } from "@/lib/after-mutation";
import { isProjectArchived } from "@/lib/project-archive";

interface ProjectActionsProps {
  project: Project;
  taskCount: number;
  materialCount: number;
}

export function ProjectActions({ project, taskCount, materialCount }: ProjectActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const archived = isProjectArchived(project);

  const setArchived = async (nextArchived: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/obras/${project.id}/arquivo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: nextArchived }),
      });
      if (!response.ok) {
        throw new Error(nextArchived ? "Erro ao arquivar obra" : "Erro ao desarquivar obra");
      }
      await afterMutation(() => router.refresh(), { projectId: project.id });
    } catch (error) {
      console.error("Error updating archive:", error);
      alert(nextArchived ? "Erro ao arquivar obra" : "Erro ao desarquivar obra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/obras/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir obra");
      }

      await afterMutation(() => router.refresh(), { projectId: project.id });
      router.push("/obras");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Erro ao excluir obra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10 lg:left-64"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md bg-white border-2 border-graphite ds-shadow z-20 py-1">
              {!archived && (
                <button
                  className="flex items-center gap-2 w-full rounded-sm mx-1 px-3 py-2 text-sm hover:bg-concrete transition-colors"
                  onClick={() => {
                    setShowMenu(false);
                    setShowEditDialog(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
              )}
              <button
                className="flex items-center gap-2 w-full rounded-sm mx-1 px-3 py-2 text-sm hover:bg-concrete transition-colors"
                disabled={loading}
                onClick={() => {
                  setShowMenu(false);
                  void setArchived(!archived);
                }}
              >
                {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                {archived ? "Desarquivar" : "Arquivar"}
              </button>
              <button
                className="flex items-center gap-2 w-full rounded-sm mx-1 px-3 py-2 text-sm text-delay hover:bg-delay-wash transition-colors"
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </>
        )}
      </div>

      <ProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        project={project}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Confirmar Exclusão"
        description={
          <>
            Tem certeza que deseja excluir a obra <strong>{project.name}</strong>?{" "}
            {formatProjectDeleteWarning({ tasks: taskCount, materials: materialCount })}{" "}
            Grupos, itens, colunas do Kanban e post-its desta obra também saem. A base SINAPI e os fornecedores do cadastro geral não são excluídos. Esta ação não pode ser desfeita.
          </>
        }
        loading={loading}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
