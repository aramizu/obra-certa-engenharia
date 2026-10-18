import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { MISSING_SUPPLIER_ERROR } from "@/lib/domain-data";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const supplierSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  contact: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Email inválido").nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
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
    const body = await request.json();
    const data = supplierSchema.parse(body);

    const [supplier] = await db
      .update(suppliers)
      .set({
        name: data.name,
        contact: data.contact || null,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        category: data.category || null,
        updatedAt: new Date(),
      })
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, user.id)))
      .returning();

    if (!supplier) {
      return NextResponse.json({ error: MISSING_SUPPLIER_ERROR }, { status: 404 });
    }

    revalidateDomainPages({ userId: user.id, supplierId: id });
    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar fornecedor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const [supplier] = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, user.id)))
      .returning();

    if (!supplier) {
      return NextResponse.json({ error: MISSING_SUPPLIER_ERROR }, { status: 404 });
    }

    revalidateDomainPages({ userId: user.id, supplierId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Erro ao excluir fornecedor" },
      { status: 500 }
    );
  }
}
