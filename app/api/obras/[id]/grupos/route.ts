import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { ensureGroup } from "@/lib/obra-items";
import { getOwnedProject } from "@/lib/owned-project";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { revalidateDomainPages } from "@/lib/revalidate-app";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1, "Nome do grupo é obrigatório"),
  budgetedAmount: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const project = await getOwnedProject(id, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    if (isProjectArchived(project)) return archivedWriteResponse();

    const data = schema.parse(await request.json());
    const group = await ensureGroup(id, data.name);
    revalidateDomainPages({ userId: user.id, projectId: id });
    return NextResponse.json({ success: true, group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar grupo" }, { status: 500 });
  }
}
