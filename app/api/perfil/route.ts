import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const schema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(80),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { name } = schema.parse(await request.json());
    await db
      .update(users)
      .set({ name, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    revalidateDomainPages({ userId: user.id });
    return NextResponse.json({ success: true, name });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao salvar perfil" }, { status: 500 });
  }
}
