import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";

export const runtime = "nodejs";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function GET() {
  const user = await validateSession();
  if (!user) return unauthorized();

  const configured = isPushConfigured();
  return NextResponse.json({
    configured,
    vapidPublicKey: configured ? getVapidPublicKey() : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return unauthorized();
    if (!isPushConfigured()) {
      return NextResponse.json({ error: "Notificações push não configuradas" }, { status: 503 });
    }

    const { endpoint, keys } = subscribeSchema.parse(await request.json());
    const userAgent = request.headers.get("user-agent");

    await db
      .insert(pushSubscriptions)
      .values({
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent,
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao ativar notificações" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return unauthorized();

    let endpoint: string | undefined;
    try {
      const body = await request.json();
      endpoint = unsubscribeSchema.parse(body).endpoint;
    } catch {
      endpoint = undefined;
    }

    if (endpoint) {
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, endpoint)));
    } else {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao desativar notificações" }, { status: 500 });
  }
}
