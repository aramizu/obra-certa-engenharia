import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { getOwnedProject } from "@/lib/owned-project";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { DEFAULT_NOTE_COLOR, isNoteColorId } from "@/lib/notes";

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const title = emptyToNull(body.title);
    const content = typeof body.content === "string" ? body.content : "";
    const color = isNoteColorId(body.color) ? body.color : DEFAULT_NOTE_COLOR;
    let projectId: string | null = emptyToNull(body.projectId);
    if (projectId) {
      const project = await getOwnedProject(projectId, user.id);
      if (!project) return NextResponse.json({ error: "Obra não encontrada" }, { status: 400 });
    }

    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${notes.position}), -1)` })
      .from(notes)
      .where(eq(notes.userId, user.id));

    const [note] = await db
      .insert(notes)
      .values({
        userId: user.id,
        projectId,
        title,
        content,
        color,
        position: (maxOrder[0]?.max ?? -1) + 1,
      })
      .returning();

    revalidateDomainPages({ userId: user.id, projectId });
    return NextResponse.json({ success: true, note });
  } catch {
    return NextResponse.json({ error: "Erro ao criar post-it" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const order = Array.isArray(body.order) ? body.order.filter((id: unknown) => typeof id === "string") : null;
    if (!order) return NextResponse.json({ error: "Ordem inválida" }, { status: 400 });

    const existing = await db.select({ id: notes.id }).from(notes).where(eq(notes.userId, user.id));
    const owned = new Set(existing.map((row) => row.id));
    if (order.some((id: string) => !owned.has(id))) {
      return NextResponse.json({ error: "Post-it inválido" }, { status: 400 });
    }

    await Promise.all(
      order.map((id: string, position: number) =>
        db
          .update(notes)
          .set({ position, updatedAt: new Date() })
          .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      )
    );

    revalidateDomainPages({ userId: user.id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao reordenar post-its" }, { status: 500 });
  }
}
