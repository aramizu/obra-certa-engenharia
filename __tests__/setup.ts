import { beforeAll, afterAll } from "vitest";

// Mock environment variables para testes
beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.DATABASE_URL_UNPOOLED = "postgresql://test:test@localhost:5432/test";
  process.env.NODE_ENV = "test";
});

afterAll(() => {
  // Cleanup
});
