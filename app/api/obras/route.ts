import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { z } from "zod";
import { revalidateDomainPages } from "@/lib/revalidate-app";

const projectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  address: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  targetEndDate: z.string().nullable().optional(),
  totalBudget: z.string().optional(),
  workType: z.enum(["reforma", "na_planta"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = projectSchema.parse(body);

    const [project] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name: data.name,
        address: data.address || null,
        startDate: data.startDate || null,
        targetEndDate: data.targetEndDate || null,
        totalBudget: data.totalBudget || "0",
        workType: data.workType || "reforma",
      })
      .returning();

    revalidateDomainPages({ userId: user.id, projectId: project.id });
    return NextResponse.json({ success: true, project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Erro ao criar obra" },
      { status: 500 }
    );
  }
}
