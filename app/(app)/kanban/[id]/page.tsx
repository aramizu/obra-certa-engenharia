import { redirect } from "next/navigation";

export default async function KanbanProjectRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/kanban?obra=${encodeURIComponent(id)}`);
}
