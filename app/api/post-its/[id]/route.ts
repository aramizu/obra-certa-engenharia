import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { getOwnedProject } from "@/lib/owned-project";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { isNoteColorId } from "@/lib/notes";

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if ("title" in body) updates.title = emptyToNull(body.title);
    if ("content" in body) updates.content = typeof body.content === "string" ? body.content : "";
    if ("color" in body) {
      if (!isNoteColorId(body.color)) return NextResponse.json({ error: "Cor inválida" }, { status: 400 });
      updates.color = body.color;
    }
    if ("projectId" in body) {
      const projectId = emptyToNull(body.projectId);
      if (projectId) {
        const project = await getOwnedProject(projectId, user.id);
        if (!project) return NextResponse.json({ error: "Obra não encontrada" }, { status: 400 });
      }
      updates.projectId = projectId;
    }
    if ("position" in body && typeof body.position === "number") updates.position = body.position;

    const [note] = await db
      .update(notes)
      .set(updates)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      .returning();

    if (!note) return NextResponse.json({ error: "Post-it não encontrado" }, { status: 404 });

    revalidateDomainPages({ userId: user.id, projectId: note.projectId });
    return NextResponse.json({ success: true, note });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar post-it" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const [note] = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
      .returning();

    if (!note) return NextResponse.json({ error: "Post-it não encontrado" }, { status: 404 });

    revalidateDomainPages({ userId: user.id, projectId: note.projectId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir post-it" }, { status: 500 });
  }
}
