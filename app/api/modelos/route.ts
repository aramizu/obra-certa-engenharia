import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { userTemplates } from "@/lib/db/schema";
import { OBRA_PRESETS } from "@/lib/obra-templates";

export const runtime = "nodejs";

export async function GET() {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const rows = await db
    .select({ id: userTemplates.id, name: userTemplates.name })
    .from(userTemplates)
    .where(eq(userTemplates.userId, user.id))
    .orderBy(asc(userTemplates.createdAt));

  return NextResponse.json({
    presets: OBRA_PRESETS.map((preset) => ({
      key: preset.key,
      name: preset.name,
      description: preset.description,
      itemCount: preset.items.length,
    })),
    user: rows.map((row) => ({
      key: `user:${row.id}`,
      name: row.name,
      description: "Modelo salvo",
    })),
  });
}
