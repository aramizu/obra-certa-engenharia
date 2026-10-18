import { unstable_cache } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { CLIENT_STALE_TIMES, KB_CACHE_TAG, userDomainTag } from "@/lib/nav-cache";
import type { KnowledgeCatalog } from "@/lib/kb-catalog";
import { loadKnowledgeCatalog } from "@/lib/kb-store";

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
        .where(eq(projects.userId, userId))
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
        .where(eq(projects.userId, userId))
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
