# Estratégia de Migração do Banco de Dados

## Contexto

Preview e Production compartilham **o mesmo banco de dados Neon**. Não existe staging separado.

## Estratégia Adotada: Migrações Automáticas em Production

### ✅ Execução Automática (Zero Configuração)

As migrações são executadas **automaticamente** após cada deploy de Production (`main` branch).

**Como funciona:**
1. Push para `main` → Vercel inicia deploy de Production
2. `next build` executa com sucesso
3. Script `postbuild.ts` detecta `VERCEL_ENV === 'production'`
4. Migrações executam usando `DATABASE_URL_UNPOOLED`
5. Se migrations falham → build falha (deploy é abortado)
6. Se migrations passam → deploy continua normalmente

### 🔒 Preview Builds: Migrações Ignoradas

Preview builds (branches não-main, PRs) **não executam migrações**:
- ✅ Builds de preview são rápidos
- ✅ Sem risco de conflitos (múltiplos previews simultâneos)
- ✅ Preview e Production usam o mesmo schema (já migrado)

**Importante:** Isso significa que previews assumem que o schema já está atualizado. Mudanças de schema devem ser testadas localmente antes de merge para `main`.

## Gerando Novas Migrações

Quando fizer alterações no schema (`lib/db/schema.ts`):

```bash
# 1. Gerar nova migração
pnpm db:generate

# 2. Revisar o arquivo SQL gerado em migrations/
# 3. Testar localmente (se possível com banco local/dev)
# 4. Commit e push para branch
# 5. Merge para main → migrations rodam automaticamente em Production
```

**Fluxo recomendado:**
1. Criar branch de feature
2. Alterar schema
3. Gerar migration
4. Testar localmente
5. Push branch → criar PR
6. Review do SQL da migration
7. Merge para `main` → **migration executa automaticamente**

## ⚠️ Cuidados Importantes

1. **Sempre revisar** o SQL gerado antes de executar
2. **Fazer backup** antes de migrações destrutivas (DROP, ALTER com mudança de tipo)
3. **Executar em horário de baixo tráfego** se possível
4. **Testar em ambiente local** primeiro (se tiver um banco local)
5. **Nunca** executar `DROP TABLE` ou `DROP COLUMN` sem backup

## Rollback

Se uma migração falhar:

1. **Não entre em pânico**
2. Verifique os logs de erro
3. Se necessário, reverta manualmente via SQL no Neon Console
4. Drizzle não tem rollback automático - você precisa escrever SQL reverso manualmente

## Primeira Execução (Setup Inicial)

A primeira migration executará **automaticamente** no primeiro deploy para `main`:

1. Merge da PR inicial para `main`
2. Vercel faz deploy de Production
3. Script `postbuild.ts` cria as tabelas automaticamente

Tabelas criadas:
- `users` - Usuários
- `sessions` - Sessões de autenticação
- `rate_limits` - Controle de rate limiting

**Nenhuma ação manual necessária!**

## Verificação

Após executar a migração, verificar no Neon Console se as tabelas foram criadas:

```sql
-- Listar todas as tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar estrutura da tabela users
\d users
```

## Segurança e Idempotência

### Idempotência
Drizzle mantém uma tabela `__drizzle_migrations` que registra quais migrations já foram executadas. Se a migration já rodou, ela é ignorada automaticamente.

**Isso significa:**
- ✅ Safe para re-deployar Production (migrations não rodam novamente)
- ✅ Safe para rollback de deploy (migrations anteriores não re-executam)
- ✅ Safe se o deploy falhar após migrations (próximo deploy continua de onde parou)

### Falhas de Migration

Se uma migration falhar durante o build:
1. ❌ Build falha (deploy é abortado)
2. 🔍 Logs de build mostram o erro SQL
3. 🔧 Corrigir o SQL da migration
4. 📝 Gerar nova migration corrigida
5. 🚀 Push novamente → tentará executar

**Importante:** Migrations executadas com sucesso não podem ser revertidas automaticamente. Se necessário fazer rollback, criar nova migration com SQL reverso.

## Desenvolvimento Local

Para testar migrations localmente (opcional):

```bash
# 1. Configurar banco local (opcional)
# 2. Criar .env.local com DATABASE_URL_UNPOOLED local
# 3. Executar migration manualmente
pnpm db:migrate
```

Mas isso é **opcional** - você pode confiar nas migrations automáticas em Production se o SQL for simples.

## Futuras Melhorias

Possíveis melhorias para o futuro:

1. **Banco de dados separado para Preview**: Criar um segundo banco Neon para Preview (habilitar migrations em preview também)
2. **Rollback scripts**: Scripts de rollback automático para cada migração
3. **Migration testing**: CI que valida SQL de migrations antes de merge
