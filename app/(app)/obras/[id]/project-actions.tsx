"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "../project-dialog";
import type { Project } from "@/lib/db/schema";
import { formatProjectDeleteWarning } from "@/lib/domain-data";

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

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/obras/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir obra");
      }

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
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg bg-white border-2 border-graphite ds-shadow z-20">
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => {
                  setShowMenu(false);
                  setShowEditDialog(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !loading && setShowDeleteConfirm(false)}
          />
          <div className="relative z-50 w-full max-w-md overflow-hidden rounded-lg bg-white text-foreground border-2 border-graphite ds-shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja excluir a obra <strong>{project.name}</strong>?{" "}
              {formatProjectDeleteWarning({ tasks: taskCount, materials: materialCount })}{" "}
              Categorias de orçamento, colunas do Kanban e marcos também saem. Fornecedores do cadastro geral não são excluídos. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
