import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { searchSinapiMaterials } from "@/lib/sinapi-search";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const q = request.nextUrl.searchParams.get("q") || "";
  return NextResponse.json({ items: searchSinapiMaterials(q) });
}
