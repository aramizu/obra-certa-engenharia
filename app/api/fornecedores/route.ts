import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  contact: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Email inválido").nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = supplierSchema.parse(body);

    const [supplier] = await db
      .insert(suppliers)
      .values({
        userId: user.id,
        name: data.name,
        contact: data.contact || null,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Erro ao criar fornecedor" },
      { status: 500 }
    );
  }
}
