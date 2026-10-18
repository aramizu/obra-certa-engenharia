import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { budgetCategories, kbMaterials, kbSupplierCategories, materials, taskColumns } from "@/lib/db/schema";

export class InvalidRefError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "InvalidRefError";
  }
}

export function isInvalidRefError(error: unknown): error is InvalidRefError {
  return error instanceof InvalidRefError;
}

export function normalizeOptionalId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Categoria de orçamento só vale se for da mesma obra. */
export async function requireBudgetCategoryOnProject(
  categoryId: string | null | undefined,
  projectId: string
) {
  const id = normalizeOptionalId(categoryId);
  if (!id) return null;
  const [row] = await db
    .select({ id: budgetCategories.id })
    .from(budgetCategories)
    .where(and(eq(budgetCategories.id, id), eq(budgetCategories.projectId, projectId)))
    .limit(1);
  if (!row) throw new InvalidRefError("Categoria inválida para esta obra.");
  return row.id;
}

export async function requireKbCategory(categoryId: string | null | undefined) {
  const id = normalizeOptionalId(categoryId);
  if (!id) return null;
  const [row] = await db
    .select({ id: kbSupplierCategories.id })
    .from(kbSupplierCategories)
    .where(eq(kbSupplierCategories.id, id))
    .limit(1);
  if (!row) throw new InvalidRefError("Categoria inválida.");
  return row.id;
}

export async function requireKbMaterial(materialId: string | null | undefined) {
  const id = normalizeOptionalId(materialId);
  if (!id) return null;
  const [row] = await db
    .select({ id: kbMaterials.id })
    .from(kbMaterials)
    .where(eq(kbMaterials.id, id))
    .limit(1);
  if (!row) throw new InvalidRefError("Material da base inválido.");
  return row.id;
}

export async function getColumnOnUser(columnId: string, userId: string) {
  const [row] = await db
    .select({ id: taskColumns.id })
    .from(taskColumns)
    .where(and(eq(taskColumns.id, columnId), eq(taskColumns.userId, userId)))
    .limit(1);
  return row ?? null;
}

/** @deprecated use getColumnOnUser — colunas do Kanban são por usuário. */
export async function getColumnOnProject(columnId: string, projectId: string) {
  const [row] = await db
    .select({ id: taskColumns.id, userId: taskColumns.userId, projectId: taskColumns.projectId })
    .from(taskColumns)
    .where(eq(taskColumns.id, columnId))
    .limit(1);
  if (!row) return null;
  if (row.projectId === projectId) return { id: row.id };
  const { projects } = await import("@/lib/db/schema");
  const [project] = await db
    .select({ userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (project && row.userId === project.userId) return { id: row.id };
  return null;
}

/** Join de gasto: só materiais da mesma obra da categoria. */
export function materialSpendOnCategoryProject() {
  return and(
    eq(materials.budgetCategoryId, budgetCategories.id),
    eq(materials.projectId, budgetCategories.projectId)
  );
}

/** Join de nome de categoria: só se a categoria for da mesma obra do material. */
export function categoryNameOnMaterialProject() {
  return and(
    eq(budgetCategories.id, materials.budgetCategoryId),
    eq(budgetCategories.projectId, materials.projectId)
  );
}
