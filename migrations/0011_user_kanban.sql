-- Kanban único por usuário: tasks.user_id + project_id nullable;
-- colunas unificadas por usuário (legado project_id fica nullable).
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "user_id" uuid;
--> statement-breakpoint
ALTER TABLE "task_columns" ADD COLUMN IF NOT EXISTS "user_id" uuid;
--> statement-breakpoint
UPDATE "tasks" AS t
SET "user_id" = p."user_id"
FROM "projects" AS p
WHERE t."project_id" = p."id" AND t."user_id" IS NULL;
--> statement-breakpoint
UPDATE "task_columns" AS c
SET "user_id" = p."user_id"
FROM "projects" AS p
WHERE c."project_id" = p."id" AND c."user_id" IS NULL;
--> statement-breakpoint
DELETE FROM "tasks" WHERE "user_id" IS NULL;
--> statement-breakpoint
DELETE FROM "task_columns" WHERE "user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "task_columns" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'task_columns_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "task_columns"
      ADD CONSTRAINT "task_columns_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_user_id_idx" ON "tasks" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_columns_user_id_idx" ON "task_columns" ("user_id");
--> statement-breakpoint
-- Unifica colunas de mesmo nome por usuário e remapeia as tarefas.
WITH ranked AS (
  SELECT
    id,
    user_id,
    lower(trim(name)) AS n,
    row_number() OVER (
      PARTITION BY user_id, lower(trim(name))
      ORDER BY "order", created_at, id
    ) AS rn
  FROM task_columns
),
dupes AS (
  SELECT r.id AS old_id, c.id AS new_id
  FROM ranked r
  JOIN ranked c
    ON c.user_id = r.user_id AND c.n = r.n AND c.rn = 1
  WHERE r.rn > 1
)
UPDATE tasks AS t
SET status_column_id = d.new_id
FROM dupes d
WHERE t.status_column_id = d.old_id;
--> statement-breakpoint
WITH ranked AS (
  SELECT
    id,
    user_id,
    lower(trim(name)) AS n,
    row_number() OVER (
      PARTITION BY user_id, lower(trim(name))
      ORDER BY "order", created_at, id
    ) AS rn
  FROM task_columns
)
DELETE FROM task_columns
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "project_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "task_columns" ALTER COLUMN "project_id" DROP NOT NULL;
--> statement-breakpoint
UPDATE "task_columns" SET "project_id" = NULL;
--> statement-breakpoint
INSERT INTO "task_columns" ("id", "user_id", "project_id", "name", "order")
SELECT gen_random_uuid(), u."id", NULL, v.name, v.ord
FROM "users" u
CROSS JOIN (VALUES
  ('A fazer', 0),
  ('Em andamento', 1),
  ('Concluído', 2)
) AS v(name, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM "task_columns" c WHERE c."user_id" = u."id"
);
