/**
 * Validação de variáveis de ambiente obrigatórias
 * Executado no startup da aplicação (runtime only)
 */

function validateEnv() {
  // Pular validação durante build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }

  const requiredEnvVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
  };

  const missingVars: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(key);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Variáveis de ambiente obrigatórias não configuradas:\n\n` +
      missingVars.map(v => `  - ${v}`).join('\n') +
      `\n\nConfigure estas variáveis no Vercel Dashboard:\n` +
      `Settings → Environment Variables\n\n` +
      `Ver SETUP.md para instruções completas.`
    );
  }

  // AUTH_SECRET é usado apenas em contextos específicos de auth
  // Validado sob demanda, não no startup
}

// Executar validação no import (apenas em runtime)
validateEnv();

export { validateEnv };
