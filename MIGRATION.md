# Estratégia de Migração do Banco de Dados

## Contexto

Preview e Production compartilham **o mesmo banco de dados Neon**. Não existe staging separado.

## Estratégia Adotada

### 🔒 Migrações NÃO rodam automaticamente em builds

Para evitar conflitos e garantir controle, as migrações **não** são executadas automaticamente durante o build do Vercel.

### ✅ Execução Manual de Migrações

As migrações devem ser executadas **manualmente** em Production através de uma das seguintes formas:

#### Opção 1: Via Vercel CLI (Recomendado)

```bash
# Instalar Vercel CLI globalmente (se necessário)
npm i -g vercel

# Fazer login
vercel login

# Executar migração em Production
vercel env pull .env.local
pnpm db:migrate
```

#### Opção 2: Via Script Local

```bash
# 1. Baixar variáveis de ambiente de Production
vercel env pull .env.local --environment production

# 2. Executar migrações
pnpm db:migrate
```

#### Opção 3: Via Neon Console

Você também pode executar o SQL diretamente no Neon Console:

1. Acesse https://console.neon.tech/
2. Selecione o projeto `minha-engenharia`
3. Abra o SQL Editor
4. Execute o conteúdo do arquivo `migrations/0000_brainy_starbolt.sql`

## Gerando Novas Migrações

Quando fizer alterações no schema (`lib/db/schema.ts`):

```bash
# 1. Gerar nova migração
pnpm db:generate

# 2. Revisar o arquivo SQL gerado em migrations/
# 3. Testar localmente (se possível)
# 4. Commit e push
# 5. Executar em Production manualmente (ver opções acima)
```

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

Para criar as tabelas pela primeira vez em Production:

```bash
# 1. Baixar env vars
vercel env pull .env.local --environment production

# 2. Executar migração inicial
pnpm db:migrate
```

Isso criará as tabelas:
- `users` - Usuários
- `sessions` - Sessões de autenticação
- `rate_limits` - Controle de rate limiting

## Verificação

Após executar a migração, verificar no Neon Console se as tabelas foram criadas:

```sql
-- Listar todas as tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar estrutura da tabela users
\d users
```

## Futuras Melhorias

Possíveis melhorias para o futuro:

1. **Banco de dados separado para Preview**: Criar um segundo banco Neon para Preview
2. **CI/CD automatizado**: Github Actions para executar migrações após merge
3. **Migrations History**: Tabela de controle de migrações executadas
4. **Rollback scripts**: Scripts de rollback para cada migração
