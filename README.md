# Obra Certa Engenharia

Plataforma de gestão de obras e engenharia com autenticação segura.

## 🚀 Links

- **Production:** https://obra-certa-engenharia.vercel.app
- **Projeto Vercel:** `minha-engenharia`
- **Região:** gru1 (São Paulo)

## 🔐 Funcionalidades

- ✅ Autenticação segura (bcrypt, sessões DB, rate limiting)
- ✅ Login e Signup em português (pt-BR)
- ✅ Mobile-first UI com Tailwind CSS
- ✅ Proteção contra brute force e enumeração de usuários
- ✅ Security headers e CSRF protection
- ✅ Migrations versionadas com Drizzle

## 📚 Documentação

- **[SETUP.md](./SETUP.md)** - Setup completo, variáveis de ambiente, arquitetura
- **[MIGRATION.md](./MIGRATION.md)** - Estratégia de migrações do banco

## 🏗️ Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- PostgreSQL (Neon) + Drizzle ORM
- Vitest para testes
- Deploy automático no Vercel

## ⚡ Quick Start

```bash
# Instalar
pnpm install

# Configurar env vars
vercel env pull .env.local

# Migrar banco (primeira vez)
pnpm db:migrate

# Dev
pnpm dev

# Testes
pnpm test
```

## 🔒 Segurança

Implementado seguindo OWASP ASVS:
- Bcrypt (cost 12) para senhas
- Sessões server-side com rotação
- Rate limiting persistido no DB
- httpOnly + Secure + SameSite cookies
- Headers de segurança (CSP, X-Frame-Options, etc.)
- Validação contra senhas comuns
- Mensagens de erro genéricas (anti-enumeração)

Ver checklist completo em [SETUP.md](./SETUP.md).

## 📝 Deploy

Todo push na `main` → deploy automático em Production.

⚠️ **Importante:** Executar migrações manualmente (ver MIGRATION.md).
