import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { getCachedKnowledgeCatalog } from "@/lib/cached-queries";

export async function GET() {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const catalog = await getCachedKnowledgeCatalog();
    return NextResponse.json({ catalog });
  } catch (error) {
    console.error("Error loading knowledge catalog:", error);
    return NextResponse.json({ error: "Erro ao carregar a base SINAPI" }, { status: 500 });
  }
}
