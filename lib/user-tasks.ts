import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, taskColumns, tasks } from "@/lib/db/schema";
import { getOwnedProject } from "@/lib/owned-project";
import { InvalidRefError, normalizeOptionalId } from "@/lib/owned-refs";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";

export const DEFAULT_KANBAN_COLUMNS = ["A fazer", "Em andamento", "Concluído"] as const;
export const SEM_OBRA_LABEL = "Sem obra";
export const OBRA_FILTER_ALL = "all";
export const OBRA_FILTER_NONE = "none";

export type ObraFilter = typeof OBRA_FILTER_ALL | typeof OBRA_FILTER_NONE | string;

export function parseObraFilter(value: string | null | undefined): ObraFilter {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed || trimmed === "all" || trimmed === "todas") return OBRA_FILTER_ALL;
  if (trimmed === "none" || trimmed === "sem") return OBRA_FILTER_NONE;
  return trimmed;
}

export function obraLabel(name: string | null | undefined) {
  const trimmed = name?.trim();
  return trimmed ? trimmed : SEM_OBRA_LABEL;
}

/** Nome da obra para chip/tag no ticket. Sem obra → não mostra tag. */
export function obraChipLabel(name: string | null | undefined) {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

/** Tarefas do usuário, sem obras arquivadas (as sem obra entram). */
export function visibleUserTasksWhere(userId: string) {
  return and(
    eq(tasks.userId, userId),
    or(
      isNull(tasks.projectId),
      and(eq(projects.userId, userId), isNull(projects.archivedAt))
    )
  );
}

export async function getOwnedTask(taskId: string, userId: string) {
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function getOwnedColumn(columnId: string, userId: string) {
  const [row] = await db
    .select()
    .from(taskColumns)
    .where(and(eq(taskColumns.id, columnId), eq(taskColumns.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function getColumnOnUser(columnId: string, userId: string) {
  return getOwnedColumn(columnId, userId);
}

export async function listUserColumns(userId: string) {
  return db
    .select()
    .from(taskColumns)
    .where(eq(taskColumns.userId, userId))
    .orderBy(asc(taskColumns.order), asc(taskColumns.createdAt));
}

export async function ensureUserKanbanColumns(userId: string) {
  let columns = await listUserColumns(userId);
  if (columns.length > 0) return columns;
  for (const [index, name] of DEFAULT_KANBAN_COLUMNS.entries()) {
    await db.insert(taskColumns).values({
      userId,
      projectId: null,
      name,
      order: index,
    });
  }
  columns = await listUserColumns(userId);
  return columns;
}

export async function firstUserColumn(userId: string) {
  const columns = await ensureUserKanbanColumns(userId);
  return columns[0] ?? null;
}

export type ResolvedProject =
  | { status: "ok"; projectId: string | null }
  | { status: "missing" }
  | { status: "archived" };

export async function resolveWritableProject(
  projectId: string | null | undefined,
  userId: string
): Promise<ResolvedProject> {
  const id = normalizeOptionalId(projectId);
  if (!id) return { status: "ok", projectId: null };
  const project = await getOwnedProject(id, userId);
  if (!project) return { status: "missing" };
  if (isProjectArchived(project)) return { status: "archived" };
  return { status: "ok", projectId: project.id };
}

export function projectResolveResponse(resolved: ResolvedProject) {
  if (resolved.status === "missing") {
    return new Response(JSON.stringify({ error: "Obra não encontrada. Ela pode ter sido excluída." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (resolved.status === "archived") return archivedWriteResponse();
  return null;
}

export async function assertTaskWritable(task: { projectId: string | null }, userId: string) {
  if (!task.projectId) return { status: "ok" as const, projectId: null };
  return resolveWritableProject(task.projectId, userId);
}

/** Filtro do board: todas (sem arquivadas), sem obra, ou uma obra específica. */
export function tasksWhereForObraFilter(userId: string, filter: ObraFilter) {
  if (filter === OBRA_FILTER_ALL) return visibleUserTasksWhere(userId);
  if (filter === OBRA_FILTER_NONE) {
    return and(eq(tasks.userId, userId), isNull(tasks.projectId));
  }
  return and(eq(tasks.userId, userId), eq(tasks.projectId, filter));
}

export function emptyToNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function nextOrderInColumn(userId: string, columnId: string | null) {
  const [row] = await db
    .select({ max: sql<number>`COALESCE(MAX(${tasks.orderInColumn}), -1)` })
    .from(tasks)
    .where(
      columnId
        ? and(eq(tasks.userId, userId), eq(tasks.statusColumnId, columnId))
        : eq(tasks.userId, userId)
    );
  return (row?.max ?? -1) + 1;
}

export { InvalidRefError };
