import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { materials, suppliers, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { MISSING_OBRA_ERROR, MISSING_SUPPLIER_ERROR } from "@/lib/domain-data";
import { archivedWriteResponse, isProjectArchived } from "@/lib/project-archive";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { isInvalidRefError, requireBudgetCategoryOnProject } from "@/lib/owned-refs";

const materialSchema = z.object({
  projectId: z.string().min(1, "Obra é obrigatória"),
  budgetCategoryId: z.string().nullable().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  brand: z.string().nullable().optional(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  quantityPerUnit: z.string().nullable().optional(),
  quantity: z.string().min(1, "Quantidade é obrigatória"),
  unitPrice: z.string().min(1, "Preço unitário é obrigatório"),
  totalPrice: z.string().min(1, "Preço total é obrigatório"),
  status: z.enum(["quoted", "purchased"]),
  purchaseDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: supplierId } = await params;

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.userId, user.id)))
      .limit(1);

    if (!supplier) {
      return NextResponse.json({ error: MISSING_SUPPLIER_ERROR }, { status: 404 });
    }

    const body = await request.json();
    const data = materialSchema.parse(body);

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, data.projectId), eq(projects.userId, user.id)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: MISSING_OBRA_ERROR }, { status: 404 });
    }
    if (isProjectArchived(project)) return archivedWriteResponse();

    const budgetCategoryId = await requireBudgetCategoryOnProject(data.budgetCategoryId, data.projectId);

    const [material] = await db
      .insert(materials)
      .values({
        projectId: data.projectId,
        budgetCategoryId,
        supplierId,
        name: data.name,
        brand: data.brand || null,
        unit: data.unit,
        quantityPerUnit: data.quantityPerUnit || null,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
        status: data.status,
        purchaseDate: data.purchaseDate || null,
        notes: data.notes || null,
      })
      .returning();

    revalidateDomainPages({ userId: user.id, projectId: data.projectId, supplierId });
    return NextResponse.json({ success: true, material });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    if (isInvalidRefError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: "Erro ao criar material" },
      { status: 500 }
    );
  }
}
