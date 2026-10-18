import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const schema = z.object({
  archived: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { archived } = schema.parse(await request.json());

    const [project] = await db
      .update(projects)
      .set({
        archivedAt: archived ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .returning();

    if (!project) {
      return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    }

    revalidateDomainPages({ userId: user.id, projectId: id });
    return NextResponse.json({ success: true, project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error archiving project:", error);
    return NextResponse.json({ error: "Erro ao arquivar obra" }, { status: 500 });
  }
}
