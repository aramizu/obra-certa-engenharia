import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não está definida. Configure a variável de ambiente no Vercel."
    );
  }

  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

// Lazy initialization - only creates connection when first accessed
let _db: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    if (!_db) {
      _db = createDb();
    }
    return Reflect.get(_db, prop);
  },
});
