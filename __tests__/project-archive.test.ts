import { describe, expect, it } from "vitest";
import { ARCHIVED_WRITE_ERROR, isProjectArchived } from "@/lib/project-archive";
import { OBRA_CASCADE_TABLES } from "@/lib/domain-data";

describe("arquivo de obra", () => {
  it("detecta archived_at sem tratar arquivo como exclusão", () => {
    expect(isProjectArchived({ archivedAt: new Date() })).toBe(true);
    expect(isProjectArchived({ archivedAt: "2026-10-18T00:00:00.000Z" })).toBe(true);
    expect(isProjectArchived({ archivedAt: null })).toBe(false);
    expect(isProjectArchived(null)).toBe(false);
    expect(isProjectArchived(undefined)).toBe(false);
    expect(OBRA_CASCADE_TABLES).not.toContain("projects");
  });

  it("bloqueia escrita em obra arquivada com 409", () => {
    expect(ARCHIVED_WRITE_ERROR).toMatch(/arquivada/i);
  });
});
