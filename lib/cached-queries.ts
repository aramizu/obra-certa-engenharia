import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { materials, projects, suppliers, tasks } from "@/lib/db/schema";
import { CLIENT_STALE_TIMES, KB_CACHE_TAG, userDomainTag } from "@/lib/nav-cache";
import { activeProjectsOwnedBy } from "@/lib/project-archive";
import type { KnowledgeCatalog } from "@/lib/kb-catalog";
import { loadKnowledgeCatalog } from "@/lib/kb-store";
import { STOCK_MATERIAL_STATUSES, type StockItem } from "@/lib/stock";

export type CachedProjectSummary = {
  id: string;
  name: string;
  address: string | null;
  totalBudget: string;
  workType: string;
  startDate: string | null;
  targetEndDate: string | null;
};

export type CachedProjectBoard = CachedProjectSummary & { taskCount: number };

/** Lista de obras do usuário (sem timestamps). Tag por userId — não vaza entre contas. */
export function getCachedUserProjects(userId: string) {
  return unstable_cache(
    async (): Promise<CachedProjectSummary[]> => {
      return db
        .select({
          id: projects.id,
          name: projects.name,
          address: projects.address,
          totalBudget: projects.totalBudget,
          workType: projects.workType,
          startDate: projects.startDate,
          targetEndDate: projects.targetEndDate,
        })
        .from(projects)
        .where(activeProjectsOwnedBy(userId))
        .orderBy(desc(projects.createdAt));
    },
    ["user-projects", userId],
    { tags: [userDomainTag(userId)], revalidate: CLIENT_STALE_TIMES.dynamic }
  )();
}

export function getCachedUserProjectBoards(userId: string) {
  return unstable_cache(
    async (): Promise<CachedProjectBoard[]> => {
      const rows = await db
        .select({
          id: projects.id,
          name: projects.name,
          address: projects.address,
          totalBudget: projects.totalBudget,
          workType: projects.workType,
          startDate: projects.startDate,
          targetEndDate: projects.targetEndDate,
          taskCount: sql<number>`COUNT(DISTINCT ${tasks.id})`,
        })
        .from(projects)
        .leftJoin(tasks, eq(projects.id, tasks.projectId))
        .where(activeProjectsOwnedBy(userId))
        .groupBy(
          projects.id,
          projects.name,
          projects.address,
          projects.totalBudget,
          projects.workType,
          projects.startDate,
          projects.targetEndDate,
          projects.createdAt
        )
        .orderBy(desc(projects.createdAt));
      return rows.map((row) => ({ ...row, taskCount: Number(row.taskCount) }));
    },
    ["user-project-boards", userId],
    { tags: [userDomainTag(userId)], revalidate: CLIENT_STALE_TIMES.dynamic }
  )();
}

export function getCachedKnowledgeCatalog() {
  return unstable_cache(
    async (): Promise<KnowledgeCatalog> => loadKnowledgeCatalog(),
    ["kb-catalog"],
    { tags: [KB_CACHE_TAG], revalidate: CLIENT_STALE_TIMES.static }
  )();
}

/** Materiais comprados das obras ativas (e sem obra, se existir) do usuário. */
export function getCachedUserStock(userId: string) {
  return unstable_cache(
    async (): Promise<StockItem[]> => {
      const rows = await db
        .select({
          id: materials.id,
          name: materials.name,
          brand: materials.brand,
          quantity: materials.quantity,
          unit: materials.unit,
          totalPrice: materials.totalPrice,
          purchaseDate: materials.purchaseDate,
          status: materials.status,
          projectId: materials.projectId,
          projectName: projects.name,
          supplierId: materials.supplierId,
          supplierName: suppliers.name,
        })
        .from(materials)
        .leftJoin(projects, eq(materials.projectId, projects.id))
        .leftJoin(suppliers, eq(materials.supplierId, suppliers.id))
        .where(
          and(
            inArray(materials.status, [...STOCK_MATERIAL_STATUSES]),
            or(
              activeProjectsOwnedBy(userId),
              and(isNull(materials.projectId), eq(suppliers.userId, userId))
            )
          )
        )
        .orderBy(asc(projects.name), asc(materials.name));

      return rows.map((row) => ({
        ...row,
        projectId: row.projectId,
        projectName: row.projectName,
      }));
    },
    ["user-stock", userId],
    { tags: [userDomainTag(userId)], revalidate: CLIENT_STALE_TIMES.dynamic }
  )();
}
