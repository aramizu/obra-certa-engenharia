import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do database ANTES do import
vi.mock("@/lib/db", () => {
  const mockDb = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };
  
  // Setup chain
  mockDb.select.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.limit.mockResolvedValue([]);
  mockDb.insert.mockReturnValue(mockDb);
  mockDb.values.mockResolvedValue(undefined);
  mockDb.update.mockReturnValue(mockDb);
  mockDb.set.mockReturnValue(mockDb);
  mockDb.delete.mockReturnValue(mockDb);
  
  return { db: mockDb };
});

vi.mock("@/lib/db/schema", () => ({
  rateLimits: {
    id: "id",
    identifier: "identifier",
    action: "action",
    attempts: "attempts",
    lastAttempt: "lastAttempt",
    lockedUntil: "lockedUntil",
  },
}));

import { checkRateLimit, recordAttempt, resetRateLimit } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementation
    (db as any).limit.mockResolvedValue([]);
  });

  it("deve permitir primeira tentativa", async () => {
    (db as any).limit.mockResolvedValueOnce([]);

    const result = await checkRateLimit("192.168.1.1", "login");

    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBeDefined();
  });

  it("deve bloquear após muitas tentativas", async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 15 * 60 * 1000);

    (db as any).limit.mockResolvedValueOnce([
      {
        id: "1",
        identifier: "192.168.1.1",
        action: "login",
        attempts: 5,
        lastAttempt: now,
        lockedUntil: futureDate,
      },
    ]);

    const result = await checkRateLimit("192.168.1.1", "login");

    expect(result.allowed).toBe(false);
    expect(result.lockedUntil).toBeDefined();
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("deve registrar tentativa", async () => {
    (db as any).limit.mockResolvedValueOnce([]);

    await recordAttempt("192.168.1.1", "login");

    expect((db as any).insert).toHaveBeenCalled();
  });

  it("deve resetar rate limit", async () => {
    await resetRateLimit("192.168.1.1", "login");

    expect((db as any).delete).toHaveBeenCalled();
  });
});
