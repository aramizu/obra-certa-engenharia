import { revalidatePath } from "next/cache";

/** Após excluir ou alterar obra/tarefa/material/fornecedor, invalida as superfícies que leem esses dados. */
export function revalidateDomainPages(projectId?: string, supplierId?: string) {
  revalidatePath("/");
  revalidatePath("/obras");
  revalidatePath("/kanban");
  revalidatePath("/gantt");
  revalidatePath("/calendario");
  revalidatePath("/fornecedores");
  revalidatePath("/admin/base");
  if (projectId) {
    revalidatePath(`/obras/${projectId}`);
    revalidatePath(`/obras/${projectId}/lista`);
    revalidatePath(`/kanban/${projectId}`);
    revalidatePath(`/gantt/${projectId}`);
  }
  if (supplierId) {
    revalidatePath(`/fornecedores/${supplierId}`);
  }
}
