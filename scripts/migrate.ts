import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  if (!process.env.DATABASE_URL_UNPOOLED) {
    throw new Error("DATABASE_URL_UNPOOLED não está definida");
  }

  console.log("🔄 Executando migrações...");

  const sql = neon(process.env.DATABASE_URL_UNPOOLED);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "./migrations" });

  console.log("✅ Migrações executadas com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro ao executar migrações:", err);
  process.exit(1);
});
