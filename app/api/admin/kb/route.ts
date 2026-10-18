import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { patchKbCategory, patchKbComposition, patchKbMaterial, patchKbModule } from "@/lib/kb-store";
import { getCachedKnowledgeCatalog } from "@/lib/cached-queries";
import { revalidateDomainPages } from "@/lib/revalidate-app";
import { isInvalidRefError } from "@/lib/owned-refs";

const patchSchema = z.object({
  kind: z.enum(["category", "material", "composition", "module"]),
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  extraLabel: z.string().nullable().optional(),
  unit: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  sinapiCode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  consumption: z.number().nonnegative().optional(),
  wastePct: z.number().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const catalog = await getCachedKnowledgeCatalog();
  return NextResponse.json({ catalog });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const data = patchSchema.parse(await request.json());
    if (data.kind === "category") {
      const row = await patchKbCategory(data.id, {
        name: data.name,
        sortOrder: data.sortOrder,
      });
      if (!row) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
      revalidateDomainPages({ userId: auth.user.id, knowledgeBase: true });
      return NextResponse.json({ success: true, row });
    }
    if (data.kind === "material") {
      const row = await patchKbMaterial(data.id, {
        name: data.name,
        unit: data.unit,
        categoryId: data.categoryId,
        sinapiCode: data.sinapiCode,
        notes: data.notes,
      });
      if (!row) return NextResponse.json({ error: "Material não encontrado." }, { status: 404 });
      revalidateDomainPages({ userId: auth.user.id, knowledgeBase: true });
      return NextResponse.json({ success: true, row });
    }
    if (data.kind === "composition") {
      const row = await patchKbComposition(data.id, {
        consumption: data.consumption != null ? String(data.consumption) : undefined,
        wastePct: data.wastePct != null ? String(data.wastePct) : undefined,
        sinapiCode: data.sinapiCode,
      });
      if (!row) return NextResponse.json({ error: "Composição não encontrada." }, { status: 404 });
      revalidateDomainPages({ userId: auth.user.id, knowledgeBase: true });
      return NextResponse.json({ success: true, row });
    }
    const row = await patchKbModule(data.id, {
      name: data.name,
      description: data.description,
      extraLabel: data.extraLabel,
    });
    if (!row) return NextResponse.json({ error: "Módulo não encontrado." }, { status: 404 });
    revalidateDomainPages({ userId: auth.user.id, knowledgeBase: true });
    return NextResponse.json({ success: true, row });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (isInvalidRefError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error updating knowledge base:", error);
    return NextResponse.json({ error: "Erro ao salvar a base" }, { status: 500 });
  }
}
