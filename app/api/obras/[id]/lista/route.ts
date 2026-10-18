import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MISSING_OBRA_ERROR } from "@/lib/domain-data";
import { getOwnedProject } from "@/lib/owned-project";
import { loadProjectLista, saveProjectLista } from "@/lib/project-lista";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const roomSchema = z.object({
  name: z.string().min(1, "Nome do cômodo é obrigatório"),
  areaM2: z.number().nonnegative(),
  widthM: z.number().nonnegative().nullable().optional(),
  lengthM: z.number().nonnegative().nullable().optional(),
  perimeterM: z.number().nonnegative().nullable().optional(),
  ceilingHeightM: z.number().positive().nullable().optional(),
  doors: z.number().int().nonnegative().nullable().optional(),
  windows: z.number().int().nonnegative().nullable().optional(),
  moduleIds: z.array(z.string()),
  packageIds: z.array(z.string()),
  extras: z.record(z.number()).optional(),
});

const saveSchema = z.object({
  workType: z.enum(["reforma", "na_planta"]),
  rooms: z.array(roomSchema).min(1, "Inclua pelo menos um cômodo"),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const project = await getOwnedProject(id, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });

    const lista = await loadProjectLista(id);
    const userSuppliers = await db.select().from(suppliers).where(eq(suppliers.userId, user.id));
    return NextResponse.json({ project, ...lista, suppliers: userSuppliers });
  } catch (error) {
    console.error("Error loading material list:", error);
    return NextResponse.json({ error: "Erro ao carregar a lista" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const project = await getOwnedProject(id, user.id);
    if (!project) return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });

    const body = saveSchema.parse(await request.json());
    const lista = await saveProjectLista(id, body.workType, body.rooms);
    revalidateDomainPages({ userId: user.id, projectId: id });
    return NextResponse.json({ success: true, project: { ...project, workType: body.workType }, ...lista });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error saving material list:", error);
    return NextResponse.json({ error: "Erro ao gerar a lista de materiais" }, { status: 500 });
  }
}
