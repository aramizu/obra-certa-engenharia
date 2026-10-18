import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { PageTitle } from "@/components/page-header";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { getCachedUserProjects } from "@/lib/cached-queries";
import { PostItsBoard } from "./post-its-board";

export default async function PostItsPage() {
  const user = await validateSession();
  if (!user) redirect("/entrar");

  const [userNotes, userProjects] = await Promise.all([
    db.select().from(notes).where(eq(notes.userId, user.id)).orderBy(notes.position, desc(notes.createdAt)),
    getCachedUserProjects(user.id),
  ]);

  return (
    <>
      <PageTitle title="Post-its" description="Mural de recados livres, opcionalmente ligados a uma obra" />
      <main className="flex-1 overflow-y-auto p-4 pt-8 lg:p-8 lg:pt-10">
        <div className="max-w-6xl mx-auto">
          <PostItsBoard initialNotes={userNotes} projects={userProjects} />
        </div>
      </main>
    </>
  );
}
