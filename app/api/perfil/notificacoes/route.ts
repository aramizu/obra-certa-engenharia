import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { flagsFromNotifyWhen, NOTIFY_WHEN_VALUES, normalizeNotifyHour, prefsFromRow } from "@/lib/push";

export const runtime = "nodejs";

const schema = z.object({
  notifyHour: z.coerce.number().int().min(0).max(23),
  notifyWhen: z.enum(NOTIFY_WHEN_VALUES),
  notifyOverdue: z.boolean(),
});

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function GET() {
  const user = await validateSession();
  if (!user) return unauthorized();

  const [row] = await db
    .select({
      notifyHour: users.notifyHour,
      notifyOnDueDay: users.notifyOnDueDay,
      notifyDayBefore: users.notifyDayBefore,
      notifyOverdue: users.notifyOverdue,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return NextResponse.json(prefsFromRow(row));
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return unauthorized();

    const body = schema.parse(await request.json());
    const flags = flagsFromNotifyWhen(body.notifyWhen);
    const notifyHour = normalizeNotifyHour(body.notifyHour);

    await db
      .update(users)
      .set({
        notifyHour,
        notifyOnDueDay: flags.notifyOnDueDay,
        notifyDayBefore: flags.notifyDayBefore,
        notifyOverdue: body.notifyOverdue,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      notifyHour,
      notifyOnDueDay: flags.notifyOnDueDay,
      notifyDayBefore: flags.notifyDayBefore,
      notifyOverdue: body.notifyOverdue,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao salvar notificações" }, { status: 500 });
  }
}
