import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { validateAvatarUpload } from "@/lib/avatar";
import { revalidateDomainPages } from "@/lib/revalidate-app";

function avatarContentHash(bytes: Buffer | Uint8Array) {
  return createHash("sha1").update(bytes).digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const [row] = await db
      .select({ avatar: users.avatar, mime: users.avatarMime })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!row?.avatar || !row.mime) {
      return new NextResponse(null, { status: 404 });
    }

    const bytes = Buffer.isBuffer(row.avatar) ? row.avatar : Buffer.from(row.avatar as Uint8Array);
    const etag = `"${avatarContentHash(bytes)}"`;
    const incoming = request.headers.get("if-none-match");
    if (incoming && incoming === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": row.mime,
        ETag: etag,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar foto" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("avatar");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Envie o arquivo da foto." }, { status: 400 });
    }

    const mime = file.type || "";
    const buffer = Buffer.from(await file.arrayBuffer());
    const check = validateAvatarUpload(mime, buffer.byteLength);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    await db
      .update(users)
      .set({ avatar: buffer, avatarMime: mime, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const version = avatarContentHash(buffer);
    revalidateDomainPages({ userId: user.id });
    return NextResponse.json({ success: true, version });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar foto" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await validateSession();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await db
      .update(users)
      .set({ avatar: null, avatarMime: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    revalidateDomainPages({ userId: user.id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao remover foto" }, { status: 500 });
  }
}
