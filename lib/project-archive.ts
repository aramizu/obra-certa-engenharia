import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { projects } from "@/lib/db/schema";

export const ARCHIVED_WRITE_ERROR = "Obra arquivada. Desarquive para editar.";

export function isProjectArchived(
  project: { archivedAt?: Date | string | null } | null | undefined
): boolean {
  return project?.archivedAt != null;
}

/** Obras ativas do usuário — dashboard, Kanban/Gantt, calendário e seletores. */
export function activeProjectsOwnedBy(userId: string) {
  return and(eq(projects.userId, userId), isNull(projects.archivedAt));
}

export function archivedWriteResponse() {
  return NextResponse.json({ error: ARCHIVED_WRITE_ERROR }, { status: 409 });
}
