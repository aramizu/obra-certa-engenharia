ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" bytea;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_mime" text;
