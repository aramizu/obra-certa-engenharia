-- Reafirma FKs: excluir obra (projects) CASCADE em tudo da obra.
-- Fornecedores são cadastro geral: materials.supplier_id fica SET NULL.
ALTER TABLE "budget_categories" DROP CONSTRAINT IF EXISTS "budget_categories_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "materials" DROP CONSTRAINT IF EXISTS "materials_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "materials" DROP CONSTRAINT IF EXISTS "materials_budget_category_id_budget_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_budget_category_id_budget_categories_id_fk" FOREIGN KEY ("budget_category_id") REFERENCES "public"."budget_categories"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "materials" DROP CONSTRAINT IF EXISTS "materials_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "task_columns" DROP CONSTRAINT IF EXISTS "task_columns_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "task_columns" ADD CONSTRAINT "task_columns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_status_column_id_task_columns_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_column_id_task_columns_id_fk" FOREIGN KEY ("status_column_id") REFERENCES "public"."task_columns"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_material_id_materials_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "task_dependencies" DROP CONSTRAINT IF EXISTS "task_dependencies_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "task_dependencies" DROP CONSTRAINT IF EXISTS "task_dependencies_depends_on_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Reset one-off aprovado pelo Rafael: apaga dados de domínio e mantém contas.
-- Apaga: task_dependencies, tasks, task_columns, materials, budget_categories, projects, suppliers.
-- Mantém: users, sessions, rate_limits.
TRUNCATE TABLE
  "task_dependencies",
  "tasks",
  "task_columns",
  "materials",
  "budget_categories",
  "projects",
  "suppliers"
CASCADE;
