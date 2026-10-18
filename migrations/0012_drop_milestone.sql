-- Remove o conceito de marco: normaliza datas e descarta is_milestone.
UPDATE "tasks"
SET
  "start_date" = COALESCE("start_date", "due_date", "end_date"),
  "due_date" = COALESCE("due_date", "start_date", "end_date"),
  "end_date" = COALESCE("end_date", "due_date", "start_date")
WHERE "is_milestone" = true
  AND ("start_date" IS NOT NULL OR "due_date" IS NOT NULL OR "end_date" IS NOT NULL);
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "is_milestone";
