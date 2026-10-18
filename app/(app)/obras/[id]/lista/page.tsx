import { redirect } from "next/navigation";

export default async function ProjectListaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/obras/${id}`);
}
