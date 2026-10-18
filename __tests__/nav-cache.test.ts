import { describe, expect, it } from "vitest";
import {
  CLIENT_STALE_TIMES,
  DOMAIN_REVALIDATE_PATHS,
  KB_CACHE_TAG,
  projectRevalidatePaths,
  userDomainTag,
} from "@/lib/nav-cache";

describe("Client Router Cache", () => {
  it("usa staleTimes dinâmico ~60s e estático ~300s", () => {
    expect(CLIENT_STALE_TIMES.dynamic).toBe(60);
    expect(CLIENT_STALE_TIMES.static).toBe(300);
  });

  it("invalida as telas de navegação e a lista da obra", () => {
    expect([...DOMAIN_REVALIDATE_PATHS]).toEqual([
      "/",
      "/obras",
      "/kanban",
      "/gantt",
      "/calendario",
      "/post-its",
      "/fornecedores",
      "/estoque",
      "/perfil",
      "/admin/base",
    ]);
    expect(projectRevalidatePaths("obra-1")).toEqual([
      "/obras/obra-1",
      "/obras/obra-1/lista",
      "/kanban/obra-1",
      "/gantt/obra-1",
    ]);
  });

  it("escopa cache server-side por usuário e não mistura contas", () => {
    expect(userDomainTag("user-a")).toBe("user:user-a:domain");
    expect(userDomainTag("user-b")).toBe("user:user-b:domain");
    expect(userDomainTag("user-a")).not.toBe(userDomainTag("user-b"));
    expect(KB_CACHE_TAG).toBe("kb-catalog");
  });
});
