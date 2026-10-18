ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "work_type" text DEFAULT 'reforma' NOT NULL;
--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "category" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_supplier_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kb_supplier_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"category_id" uuid NOT NULL,
	"sinapi_code" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kb_materials_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_modules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"quantity_unit" text NOT NULL,
	"qty_from" text NOT NULL,
	"is_demolition" boolean DEFAULT false NOT NULL,
	"extra_label" text,
	"extra_kind" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kb_modules_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_compositions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"module_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"consumption" numeric(15, 4) NOT NULL,
	"waste_pct" numeric(8, 2) DEFAULT '0' NOT NULL,
	"sinapi_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_packages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"default_points" integer,
	"default_wall_m" numeric(10, 2),
	"default_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kb_packages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_package_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"area_m2" numeric(10, 2) DEFAULT '0' NOT NULL,
	"width_m" numeric(10, 2),
	"length_m" numeric(10, 2),
	"perimeter_m" numeric(10, 2),
	"ceiling_height_m" numeric(10, 2) DEFAULT '2.70' NOT NULL,
	"doors" integer DEFAULT 1 NOT NULL,
	"windows" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_room_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"package_id" uuid,
	"extra_qty" numeric(10, 3) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_suggested_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"kb_material_id" uuid,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"quantity" numeric(15, 3) NOT NULL,
	"category_id" uuid,
	"category_name" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'suggested' NOT NULL,
	"linked_material_id" uuid,
	"sinapi_code" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kb_materials" DROP CONSTRAINT IF EXISTS "kb_materials_category_id_kb_supplier_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "kb_materials" ADD CONSTRAINT "kb_materials_category_id_kb_supplier_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."kb_supplier_categories"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kb_compositions" DROP CONSTRAINT IF EXISTS "kb_compositions_module_id_kb_modules_id_fk";
--> statement-breakpoint
ALTER TABLE "kb_compositions" ADD CONSTRAINT "kb_compositions_module_id_kb_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."kb_modules"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kb_compositions" DROP CONSTRAINT IF EXISTS "kb_compositions_material_id_kb_materials_id_fk";
--> statement-breakpoint
ALTER TABLE "kb_compositions" ADD CONSTRAINT "kb_compositions_material_id_kb_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."kb_materials"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kb_package_modules" DROP CONSTRAINT IF EXISTS "kb_package_modules_package_id_kb_packages_id_fk";
--> statement-breakpoint
ALTER TABLE "kb_package_modules" ADD CONSTRAINT "kb_package_modules_package_id_kb_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."kb_packages"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "kb_package_modules" DROP CONSTRAINT IF EXISTS "kb_package_modules_module_id_kb_modules_id_fk";
--> statement-breakpoint
ALTER TABLE "kb_package_modules" ADD CONSTRAINT "kb_package_modules_module_id_kb_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."kb_modules"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_rooms" DROP CONSTRAINT IF EXISTS "project_rooms_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "project_rooms" ADD CONSTRAINT "project_rooms_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_room_modules" DROP CONSTRAINT IF EXISTS "project_room_modules_room_id_project_rooms_id_fk";
--> statement-breakpoint
ALTER TABLE "project_room_modules" ADD CONSTRAINT "project_room_modules_room_id_project_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."project_rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_room_modules" DROP CONSTRAINT IF EXISTS "project_room_modules_module_id_kb_modules_id_fk";
--> statement-breakpoint
ALTER TABLE "project_room_modules" ADD CONSTRAINT "project_room_modules_module_id_kb_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."kb_modules"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_room_modules" DROP CONSTRAINT IF EXISTS "project_room_modules_package_id_kb_packages_id_fk";
--> statement-breakpoint
ALTER TABLE "project_room_modules" ADD CONSTRAINT "project_room_modules_package_id_kb_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."kb_packages"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_suggested_items" DROP CONSTRAINT IF EXISTS "project_suggested_items_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "project_suggested_items" ADD CONSTRAINT "project_suggested_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_suggested_items" DROP CONSTRAINT IF EXISTS "project_suggested_items_kb_material_id_kb_materials_id_fk";
--> statement-breakpoint
ALTER TABLE "project_suggested_items" ADD CONSTRAINT "project_suggested_items_kb_material_id_kb_materials_id_fk" FOREIGN KEY ("kb_material_id") REFERENCES "public"."kb_materials"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_suggested_items" DROP CONSTRAINT IF EXISTS "project_suggested_items_category_id_kb_supplier_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "project_suggested_items" ADD CONSTRAINT "project_suggested_items_category_id_kb_supplier_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."kb_supplier_categories"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_suggested_items" DROP CONSTRAINT IF EXISTS "project_suggested_items_linked_material_id_materials_id_fk";
--> statement-breakpoint
ALTER TABLE "project_suggested_items" ADD CONSTRAINT "project_suggested_items_linked_material_id_materials_id_fk" FOREIGN KEY ("linked_material_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_materials_category_id_idx" ON "kb_materials" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_compositions_module_id_idx" ON "kb_compositions" USING btree ("module_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_compositions_material_id_idx" ON "kb_compositions" USING btree ("material_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_package_modules_package_id_idx" ON "kb_package_modules" USING btree ("package_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_rooms_project_id_idx" ON "project_rooms" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_room_modules_room_id_idx" ON "project_room_modules" USING btree ("room_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_suggested_items_project_id_idx" ON "project_suggested_items" USING btree ("project_id");
