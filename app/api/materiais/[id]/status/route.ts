import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { materials, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { formatISODate, today } from "@/lib/date";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await request.json();
    if (status !== "quoted" && status !== "purchased") {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const [owned] = await db
      .select({ id: materials.id })
      .from(materials)
      .innerJoin(projects, eq(materials.projectId, projects.id))
      .where(and(eq(materials.id, id), eq(projects.userId, user.id)))
      .limit(1);

    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [material] = await db
      .update(materials)
      .set({
        status,
        purchaseDate: status === "purchased" ? formatISODate(today()) : null,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, id))
      .returning();

    return NextResponse.json({ success: true, material });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
