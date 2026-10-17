# Setup - Minha Engenharia

## 🔐 Variáveis de Ambiente Obrigatórias

### ⚠️ Ação Necessária: Configurar no Vercel

As seguintes variáveis **precisam ser configuradas manualmente** no Vercel Dashboard:

#### 1. AUTH_SECRET (OBRIGATÓRIO)

```bash
# Gerar um secret criptograficamente seguro (64 caracteres)
openssl rand -base64 48
```

**Onde adicionar:**
1. Vercel Dashboard → Projeto `minha-engenharia` → Settings → Environment Variables
2. Nome: `AUTH_SECRET`
3. Value: (colar o valor gerado acima)
4. Environments: ✅ Production, ✅ Preview
5. Salvar

**⚠️ A aplicação vai falhar se esta variável não existir!**

### Variáveis Existentes (Já Configuradas)

Estas variáveis já estão configuradas via Neon Marketplace integration:

- ✅ `DATABASE_URL` (pooled connection)
- ✅ `DATABASE_URL_UNPOOLED` (direct connection)
- ✅ `POSTGRES_URL*` (múltiplas variações)
- ✅ `PG*` (variáveis PostgreSQL)
- ✅ `NEON_PROJECT_ID`
- ✅ `NEON_AUTH_BASE_URL`
- ✅ `VITE_NEON_AUTH_URL`

## 🗄️ Setup do Banco de Dados

### Migrações Automáticas ✨

As migrações executam **automaticamente** em Production após cada deploy de `main`:
- ✅ Zero configuração necessária
- ✅ Idempotentes (safe para re-deploy)
- ✅ Build falha se migration falhar (deploy é abortado)

**Você não precisa fazer nada!** O primeiro deploy para `main` criará as tabelas automaticamente.

Ver `MIGRATION.md` para estratégia completa de migrações.

## 🧪 Testes

```bash
# Rodar todos os testes
pnpm test

# Rodar testes com UI
pnpm test:ui
```

### Cobertura de Testes

- ✅ Validação de senha (força, senhas comuns)
- ✅ Hash e verificação de senha (bcrypt)
- ✅ Normalização de email
- ✅ Rate limiting (login, signup)
- ✅ Validação de formulários
- ✅ Headers de segurança

## 🏗️ Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Configurar .env.local com variáveis do Vercel
vercel env pull .env.local

# Rodar em modo dev
pnpm dev

# Build de produção (teste local)
pnpm build
pnpm start
```

## 🛡️ Medidas de Segurança Implementadas

### ✅ Checklist OWASP ASVS

#### 1. Armazenamento Seguro de Senhas
- ✅ bcrypt com cost factor 12 (apropriado para produção)
- ✅ Hash único por senha (salt automático)
- ✅ Verificação timing-safe

#### 2. Gestão de Sessões
- ✅ Sessions armazenadas no banco de dados
- ✅ Tokens criptograficamente seguros (32 bytes)
- ✅ Expiração de 7 dias
- ✅ Rotação automática de sessão (renovação na metade do período)
- ✅ Logout com invalidação server-side
- ✅ CASCADE delete quando usuário é removido

#### 3. Cookies Seguros
- ✅ `httpOnly`: true (não acessível via JavaScript)
- ✅ `secure`: true (HTTPS only em produção)
- ✅ `sameSite`: 'lax' (proteção CSRF)
- ✅ `path`: '/' (escopo limitado)

#### 4. Rate Limiting & Brute Force Protection
- ✅ Rate limit persistido no banco (serverless-safe)
- ✅ Login: 5 tentativas / hora, bloqueio de 15 minutos
- ✅ Signup: 3 tentativas / hora, bloqueio de 1 hora
- ✅ Lockout por IP
- ✅ Contador de falhas por usuário
- ✅ Reset automático após sucesso

#### 5. Prevenção de Enumeração de Usuários
- ✅ Mensagens de erro genéricas
- ✅ Timing constante (não revela se usuário existe)
- ✅ Rate limit também em signup

#### 6. Validação de Senha
- ✅ Mínimo 8 caracteres
- ✅ Verificação contra top 100 senhas comuns
- ✅ Validação server-side e client-side

#### 7. Email
- ✅ Normalização (lowercase + trim)
- ✅ Constraint UNIQUE no banco
- ✅ Schema preparado para verificação de email (token + expiry)

#### 8. Proteção de Rotas
- ✅ Middleware Next.js para auth check
- ✅ Validação server-side em cada página
- ✅ Redirect automático para /entrar se não autenticado

#### 9. Security Headers
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- ✅ Content Security Policy (CSP)

#### 10. Proteção CSRF
- ✅ Infraestrutura pronta (`lib/auth/csrf.ts`)
- ✅ SameSite cookies
- ⚠️ Token CSRF não implementado ainda (pode ser adicionado nas rotas API)

#### 11. SQL Injection
- ✅ Drizzle ORM com queries parametrizadas
- ✅ Zero SQL raw

#### 12. Inputs
- ✅ Validação com Zod
- ✅ Sanitização automática (trim)
- ✅ Type-safety com TypeScript

## 📋 Funcionalidades Pendentes (Design Pronto)

### Verificação de Email
- Schema preparado: `email_verification_token`, `email_verification_expiry`
- Necessita: Serviço de email (SendGrid, Resend, etc.)
- Fluxo: Gerar token → Enviar email → Validar token → Marcar `email_verified`

### Reset de Senha
- Schema preparado: `password_reset_token`, `password_reset_expiry`
- Necessita: Serviço de email
- Fluxo: Solicitar reset → Enviar email com token → Validar token → Atualizar senha

### Como adicionar no futuro:
1. Adicionar env var `EMAIL_SERVICE_API_KEY`
2. Criar `/api/auth/verificar-email` e `/api/auth/resetar-senha`
3. Implementar envio de email com template pt-BR
4. Adicionar rotas de UI para reset

## 🏗️ Arquitetura

### Stack
- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS 4
- **Banco:** PostgreSQL (Neon, gru1)
- **ORM:** Drizzle
- **Autenticação:** Custom (bcrypt + sessões DB)
- **Testes:** Vitest
- **Deploy:** Vercel (gru1)

### Decisões Técnicas

#### Por que Custom Auth (não Better Auth ou Auth.js)?
1. **Controle total** sobre segurança e fluxo
2. **Sem dependências complexas** - mais fácil de manter
3. **Performance** - sem overhead de biblioteca
4. **Aprendizado** - código transparente e auditável
5. **Adequação** - requisitos específicos (rate limiting DB, etc.)

#### Por que bcrypt (não Argon2id)?
1. **Amplamente testado** em produção
2. **Suporte nativo** no Node.js
3. **Cost factor 12** é apropriado para 2024
4. ✅ Aprovado OWASP
5. Argon2id seria ideal, mas bcrypt é suficiente e mais simples

#### Por que Drizzle (não Prisma)?
1. **Type-safety** total
2. **Lightweight** - bundle menor
3. **SQL-like** - mais controle
4. **Migrations** versionadas em SQL
5. **Performance** - queries otimizadas

## 📁 Estrutura do Projeto

```
/workspace
├── app/                          # Next.js App Router
│   ├── api/auth/                 # API routes de autenticação
│   │   ├── entrar/route.ts       # POST /api/auth/entrar
│   │   ├── criar-conta/route.ts  # POST /api/auth/criar-conta
│   │   └── sair/route.ts         # POST /api/auth/sair
│   ├── entrar/                   # Página de login
│   │   ├── page.tsx
│   │   └── login-form.tsx
│   ├── criar-conta/              # Página de signup
│   │   ├── page.tsx
│   │   └── signup-form.tsx
│   ├── page.tsx                  # Home (autenticada)
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── auth/                     # Utilitários de autenticação
│   │   ├── password.ts           # Hash, validação, normalização
│   │   ├── session.ts            # Gestão de sessões
│   │   ├── rate-limit.ts         # Rate limiting
│   │   └── csrf.ts               # CSRF protection (pronto, não usado)
│   └── db/
│       ├── schema.ts             # Schema Drizzle
│       └── index.ts              # Cliente DB
├── migrations/                   # Migrações SQL versionadas
│   └── 0000_brainy_starbolt.sql
├── scripts/
│   └── migrate.ts                # Script de migração
├── __tests__/                    # Testes Vitest
│   ├── auth/
│   │   ├── password.test.ts
│   │   ├── rate-limit.test.ts
│   │   └── api-routes.test.ts
│   └── setup.ts
├── middleware.ts                 # Middleware Next.js (auth + headers)
├── drizzle.config.ts
├── vitest.config.ts
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
├── vercel.json                   # 🚨 MANTIDO (redirect minha-engenharia → obra-certa)
├── MIGRATION.md                  # Estratégia de migrações
├── SETUP.md                      # Este arquivo
└── README.md                     # Overview do projeto
```

## 🚀 Deploy

### Primeira Deploy (Após Configurar AUTH_SECRET)

```bash
# 1. Commit e push
git add .
git commit -m "feat: implementa autenticação segura"
git push origin main

# 2. Vercel faz deploy automático
#    - Build executa
#    - Migrações executam automaticamente (VERCEL_ENV=production)
#    - Tabelas são criadas no banco Neon

# 3. Testar em https://obra-certa-engenharia.vercel.app
```

**É só isso!** Migrations rodam automaticamente, não precisa de Vercel CLI.

### Verificar Redirect

O redirect de `minha-engenharia.vercel.app` → `obra-certa-engenharia.vercel.app` está configurado em `vercel.json` e será mantido.

Testar:
```bash
curl -I https://minha-engenharia.vercel.app
# Deve retornar: 308 Permanent Redirect
# Location: https://obra-certa-engenharia.vercel.app/
```

## 📞 Suporte

Se algo falhar:

1. **Verificar env vars** no Vercel Dashboard
2. **Verificar logs** no Vercel (Runtime Logs)
3. **Verificar banco** no Neon Console
4. **Verificar migrations** - rodar manualmente se necessário

## ✅ Como Testar a Autenticação

1. Acessar https://obra-certa-engenharia.vercel.app/criar-conta
2. Criar uma conta com email válido
3. Verificar que é redirecionado para home
4. Ver mensagem "Olá, [seu nome]!"
5. Clicar em "Sair"
6. Verificar que é redirecionado para /entrar
7. Fazer login novamente
8. Testar rate limiting (tentar 6 logins falhados)
9. Verificar que é bloqueado temporariamente

## 🔍 Troubleshooting

### "DATABASE_URL não está definida"
→ Configurar env vars no Vercel (já devem estar via Neon integration)

### "AUTH_SECRET não está definida" (em runtime, ao tentar login)
→ Gerar e configurar no Vercel (ver seção acima)

### Build falha durante migrations
→ Verificar `DATABASE_URL_UNPOOLED` está configurada (deve estar via Neon integration)
→ Ver logs de build no Vercel para erro SQL específico
→ Corrigir SQL da migration e fazer novo deploy

### Redirect não funciona
→ Verificar `vercel.json` está presente e correto
