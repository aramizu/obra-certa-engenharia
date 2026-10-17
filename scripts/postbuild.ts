/**
 * Post-build script que executa migrações APENAS em Production
 * Executado automaticamente após `next build` em Production
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function runMigrations() {
  // Apenas executar em Production
  if (process.env.VERCEL_ENV !== "production") {
    console.log(
      `⏭️  Migrações ignoradas (VERCEL_ENV=${process.env.VERCEL_ENV || "local"})`
    );
    console.log("   Migrações rodam automaticamente APENAS em Production");
    return;
  }

  console.log("🔄 Executando migrações em Production...");

  if (!process.env.DATABASE_URL_UNPOOLED) {
    console.error(
      "❌ DATABASE_URL_UNPOOLED não está definida. Verifique a integração Neon no Vercel."
    );
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL_UNPOOLED);
    const db = drizzle(sql);

    await migrate(db, { migrationsFolder: "./migrations" });

    console.log("✅ Migrações executadas com sucesso em Production!");
  } catch (error) {
    console.error("❌ Erro ao executar migrações:", error);
    process.exit(1);
  }
}

runMigrations();
