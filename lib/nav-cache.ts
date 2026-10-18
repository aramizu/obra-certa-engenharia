/** Client Router Cache (Next 15 experimental.staleTimes), em segundos. */
export const CLIENT_STALE_TIMES = {
  dynamic: 60,
  static: 300,
} as const;

export const KB_CACHE_TAG = "kb-catalog";

export const DOMAIN_REVALIDATE_PATHS = [
  "/",
  "/obras",
  "/kanban",
  "/gantt",
  "/calendario",
  "/fornecedores",
  "/admin/base",
] as const;

export function userDomainTag(userId: string) {
  return `user:${userId}:domain`;
}

export function projectRevalidatePaths(projectId: string) {
  return [
    `/obras/${projectId}`,
    `/obras/${projectId}/lista`,
    `/kanban/${projectId}`,
    `/gantt/${projectId}`,
  ] as const;
}
