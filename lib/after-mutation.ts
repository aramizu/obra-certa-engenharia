"use client";

import { revalidateDomainAction } from "@/lib/actions/revalidate-domain";
import type { RevalidateDomainInput } from "@/lib/revalidate-app";

/** Depois de um fetch de mutação: derruba cache do client nas rotas de domínio e recarrega a tela atual. */
export async function afterMutation(
  refresh: () => void,
  input: Omit<RevalidateDomainInput, "userId"> = {}
) {
  await revalidateDomainAction(input);
  refresh();
}
