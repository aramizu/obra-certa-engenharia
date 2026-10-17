import { NextRequest, NextResponse } from "next/server";
import { invalidateSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    await invalidateSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return NextResponse.json(
      { error: "Erro ao processar logout" },
      { status: 500 }
    );
  }
}
