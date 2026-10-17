import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, suppliers } from "@/lib/db/schema";

export async function getOwnedProject(projectId: string, userId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project ?? null;
}

export async function getOwnedSupplier(supplierId: string, userId: string) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.userId, userId)))
    .limit(1);
  return supplier ?? null;
}
