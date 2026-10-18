import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { taskColumns } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { ensureUserKanbanColumns } from "@/lib/user-tasks";

export async function POST(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureUserKanbanColumns(user.id);

    const { name } = await request.json();
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) {
      return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
    }

    const maxOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${taskColumns.order}), -1)` })
      .from(taskColumns)
      .where(eq(taskColumns.userId, user.id));

    const [column] = await db.insert(taskColumns).values({
      userId: user.id,
      projectId: null,
      name: trimmed,
      order: (maxOrder[0]?.max ?? -1) + 1,
    }).returning();

    revalidateDomainPages({ userId: user.id });
    return NextResponse.json({ success: true, column });
  } catch {
    return NextResponse.json({ error: "Erro ao criar coluna" }, { status: 500 });
  }
}
