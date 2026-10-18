"use server";

import { validateSession } from "@/lib/auth/session";
import { revalidateDomainPages, type RevalidateDomainInput } from "@/lib/revalidate-app";

/** Invalida o Client Router Cache das telas de domínio (Server Action). */
export async function revalidateDomainAction(
  input: Omit<RevalidateDomainInput, "userId"> = {}
) {
  const user = await validateSession();
  if (!user) return;
  revalidateDomainPages({ ...input, userId: user.id });
}
