import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { materials, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { formatISODate, today } from "@/lib/date";
import { MISSING_MATERIAL_ERROR } from "@/lib/domain-data";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { ITEM_STATUSES, normalizeItemStatus } from "@/lib/item-status";

export const dynamic = "force-dynamic";

function methodNotAllowed() {
  return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
}

export async function GET() {
  return methodNotAllowed();
}

export async function POST() {
  return methodNotAllowed();
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const raw = typeof body === "object" && body && "status" in body ? (body as { status: unknown }).status : undefined;
    if (typeof raw !== "string") {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    const allowed = new Set<string>([...ITEM_STATUSES, "quoted", "purchased"]);
    if (!allowed.has(raw)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    const status = normalizeItemStatus(raw);

    const [owned] = await db
      .select({ id: materials.id, archivedAt: projects.archivedAt })
      .from(materials)
      .innerJoin(projects, eq(materials.projectId, projects.id))
      .where(and(eq(materials.id, id), eq(projects.userId, user.id)))
      .limit(1);

    if (!owned) return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 });
    if (isProjectArchived(owned)) return archivedWriteResponse();

    const [material] = await db
      .update(materials)
      .set({
        status,
        purchaseDate: status === "comprado" ? formatISODate(today()) : null,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, id))
      .returning();

    if (!material) return NextResponse.json({ error: MISSING_MATERIAL_ERROR }, { status: 404 });

    revalidateDomainPages({ userId: user.id, projectId: material.projectId });
    return NextResponse.json({ success: true, material });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar material" }, { status: 500 });
  }
}
