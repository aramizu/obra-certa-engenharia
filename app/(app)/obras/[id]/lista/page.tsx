import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOwnedProject } from "@/lib/owned-project";
import { loadProjectLista } from "@/lib/project-lista";
import { ListaView } from "./lista-view";
import { ArchivedObraBanner } from "@/components/archived-obra-banner";
import { isProjectArchived } from "@/lib/project-archive";

export default async function ProjectListaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const { id } = await params;
  const project = await getOwnedProject(id, user.id);
  if (!project) redirect("/obras?aviso=obra-inexistente");
  const archived = isProjectArchived(project);

  const lista = await loadProjectLista(id);
  const userSuppliers = await db.select().from(suppliers).where(eq(suppliers.userId, user.id));

  return (
    <>
      <PageTitle title="Lista de materiais" description={project.name} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          {archived && <ArchivedObraBanner projectId={project.id} />}
          <div {...(archived ? { inert: true } : {})}>
          <ListaView
            project={project}
            catalog={lista.catalog}
            initialRooms={lista.rooms.map((room) => ({
              key: room.id,
              name: room.name,
              areaM2: room.areaM2,
              widthM: room.widthM,
              lengthM: room.lengthM,
              perimeterM: room.perimeterM,
              ceilingHeightM: room.ceilingHeightM,
              doors: room.doors,
              windows: room.windows,
              moduleIds: room.moduleIds,
              packageIds: room.packageIds,
              extras: room.extras,
            }))}
            initialItems={lista.items}
            suppliers={userSuppliers}
          />
          </div>
        </div>
      </main>
    </>
  );
}
