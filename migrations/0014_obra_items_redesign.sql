ALTER TABLE "materials" ALTER COLUMN "unit" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "quantity" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "unit_price" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "total_price" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "status" SET DEFAULT 'a_definir';
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "kb_ref_id" uuid;
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "kb_ref_code" text;
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "ref_unit" text;
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "ref_unit_price" numeric(15, 2);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'materials_kb_ref_id_kb_materials_id_fk'
  ) THEN
    ALTER TABLE "materials"
      ADD CONSTRAINT "materials_kb_ref_id_kb_materials_id_fk"
      FOREIGN KEY ("kb_ref_id") REFERENCES "public"."kb_materials"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "materials_kb_ref_id_idx" ON "materials" USING btree ("kb_ref_id");
--> statement-breakpoint
UPDATE "materials" SET "status" = 'cotando'
WHERE lower(trim("status")) IN ('quoted', 'cotado', 'cotando');
--> statement-breakpoint
UPDATE "materials" SET "status" = 'comprado'
WHERE lower(trim("status")) IN ('purchased', 'delivered', 'received', 'comprado', 'entregue', 'recebido');
--> statement-breakpoint
UPDATE "materials" SET "status" = 'a_definir'
WHERE "status" IS NULL OR lower(trim("status")) NOT IN ('a_definir', 'cotando', 'comprado');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_templates_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "user_templates"
      ADD CONSTRAINT "user_templates_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_templates_user_id_idx" ON "user_templates" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(15, 3),
	"unit" text,
	"unit_price" numeric(15, 2),
	"notes" text,
	"group_name" text,
	"kb_ref_id" uuid,
	"kb_ref_code" text,
	"ref_unit" text,
	"ref_unit_price" numeric(15, 2),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_template_items_template_id_user_templates_id_fk'
  ) THEN
    ALTER TABLE "user_template_items"
      ADD CONSTRAINT "user_template_items_template_id_user_templates_id_fk"
      FOREIGN KEY ("template_id") REFERENCES "public"."user_templates"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_template_items_kb_ref_id_kb_materials_id_fk'
  ) THEN
    ALTER TABLE "user_template_items"
      ADD CONSTRAINT "user_template_items_kb_ref_id_kb_materials_id_fk"
      FOREIGN KEY ("kb_ref_id") REFERENCES "public"."kb_materials"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_template_items_template_id_idx" ON "user_template_items" USING btree ("template_id");
--> statement-breakpoint
DO $$
DECLARE
  rec RECORD;
  cat_id uuid;
  max_ord int;
  group_name text;
BEGIN
  FOR rec IN
    SELECT i.*
    FROM "project_suggested_items" i
    WHERE i."linked_material_id" IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM "materials" m
        WHERE m."project_id" = i."project_id"
          AND m."name" = i."name"
          AND m."kb_ref_id" IS NOT DISTINCT FROM i."kb_material_id"
          AND m."notes" LIKE 'Lista da obra%'
      )
  LOOP
    group_name := NULLIF(trim(rec."category_name"), '');
    IF group_name IS NULL THEN
      group_name := 'Outros';
    END IF;

    SELECT c."id" INTO cat_id
    FROM "budget_categories" c
    WHERE c."project_id" = rec."project_id" AND c."name" = group_name
    LIMIT 1;

    IF cat_id IS NULL THEN
      SELECT COALESCE(MAX(c."order"), -1) INTO max_ord
      FROM "budget_categories" c
      WHERE c."project_id" = rec."project_id";
      INSERT INTO "budget_categories" ("project_id", "name", "budgeted_amount", "order")
      VALUES (rec."project_id", group_name, '0', max_ord + 1)
      RETURNING "id" INTO cat_id;
    END IF;

    INSERT INTO "materials" (
      "project_id",
      "budget_category_id",
      "name",
      "unit",
      "quantity",
      "status",
      "kb_ref_id",
      "kb_ref_code",
      "ref_unit",
      "notes"
    ) VALUES (
      rec."project_id",
      cat_id,
      rec."name",
      rec."unit",
      rec."quantity",
      'a_definir',
      rec."kb_material_id",
      rec."sinapi_code",
      rec."unit",
      CASE WHEN rec."source" = 'custom' THEN 'Lista da obra (extra)' ELSE 'Lista da obra' END
    );
  END LOOP;
END $$;
