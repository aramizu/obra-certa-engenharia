import { revalidatePath, revalidateTag } from "next/cache";
import {
  DOMAIN_REVALIDATE_PATHS,
  KB_CACHE_TAG,
  projectRevalidatePaths,
  userDomainTag,
} from "@/lib/nav-cache";

export type RevalidateDomainInput = {
  userId?: string;
  projectId?: string | null;
  supplierId?: string | null;
  knowledgeBase?: boolean;
};

/** Após criar/editar/excluir obra, tarefa, material, fornecedor ou lista. */
export function revalidateDomainPages(input: RevalidateDomainInput = {}) {
  const { userId, projectId, supplierId, knowledgeBase } = input;

  for (const path of DOMAIN_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  if (projectId) {
    for (const path of projectRevalidatePaths(projectId)) {
      revalidatePath(path);
    }
  }
  if (supplierId) {
    revalidatePath(`/fornecedores/${supplierId}`);
  }
  if (userId) {
    revalidateTag(userDomainTag(userId));
  }
  if (knowledgeBase) {
    revalidateTag(KB_CACHE_TAG);
    revalidatePath("/admin/base");
  }
}
