import { pgTable, text, timestamp, boolean, integer, uuid, index, numeric, date, customType, uniqueIndex } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailNormalized: text("email_normalized").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  avatar: bytea("avatar"),
  avatarMime: text("avatar_mime"),
  notifyHour: integer("notify_hour").notNull().default(8),
  notifyOnDueDay: boolean("notify_on_due_day").notNull().default(true),
  notifyDayBefore: boolean("notify_day_before").notNull().default(true),
  notifyOverdue: boolean("notify_overdue").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  emailNormalizedIdx: index("users_email_normalized_idx").on(table.emailNormalized),
  emailVerificationTokenIdx: index("users_email_verification_token_idx").on(table.emailVerificationToken),
  passwordResetTokenIdx: index("users_password_reset_token_idx").on(table.passwordResetToken),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
}, (table) => ({
  tokenIdx: index("sessions_token_idx").on(table.token),
  userIdIdx: index("sessions_user_id_idx").on(table.userId),
  expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
}));

export const rateLimits = pgTable("rate_limits", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").notNull(),
  action: text("action").notNull(),
  attempts: integer("attempts").notNull().default(1),
  lastAttempt: timestamp("last_attempt").notNull().defaultNow(),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  identifierActionIdx: index("rate_limits_identifier_action_idx").on(table.identifier, table.action),
  lockedUntilIdx: index("rate_limits_locked_until_idx").on(table.lockedUntil),
}));

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  startDate: date("start_date"),
  targetEndDate: date("target_end_date"),
  totalBudget: numeric("total_budget", { precision: 15, scale: 2 }).notNull().default("0"),
  workType: text("work_type").notNull().default("reforma"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("projects_user_id_idx").on(table.userId),
}));

export const budgetCategories = pgTable("budget_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  budgetedAmount: numeric("budgeted_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index("budget_categories_project_id_idx").on(table.projectId),
}));

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("suppliers_user_id_idx").on(table.userId),
}));

export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  budgetCategoryId: uuid("budget_category_id").references(() => budgetCategories.id, { onDelete: "set null" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  brand: text("brand"),
  unit: text("unit").notNull(),
  quantityPerUnit: numeric("quantity_per_unit", { precision: 15, scale: 3 }),
  quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("quoted"),
  purchaseDate: date("purchase_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index("materials_project_id_idx").on(table.projectId),
  budgetCategoryIdIdx: index("materials_budget_category_id_idx").on(table.budgetCategoryId),
  statusIdx: index("materials_status_idx").on(table.status),
}));

export const taskColumns = pgTable("task_columns", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("task_columns_user_id_idx").on(table.userId),
  projectIdIdx: index("task_columns_project_id_idx").on(table.projectId),
}));

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull().default("task"),
  statusColumnId: uuid("status_column_id").references(() => taskColumns.id, { onDelete: "set null" }),
  orderInColumn: integer("order_in_column").notNull().default(0),
  dueDate: date("due_date"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  assignee: text("assignee"),
  color: text("color"),
  materialId: uuid("material_id").references(() => materials.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("tasks_user_id_idx").on(table.userId),
  projectIdIdx: index("tasks_project_id_idx").on(table.projectId),
  statusColumnIdIdx: index("tasks_status_column_id_idx").on(table.statusColumnId),
  dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
}));

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull().default(""),
  color: text("color").notNull().default("yellow"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("notes_user_id_idx").on(table.userId),
  projectIdIdx: index("notes_project_id_idx").on(table.projectId),
}));

export const taskDependencies = pgTable("task_dependencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependsOnTaskId: uuid("depends_on_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  taskIdIdx: index("task_dependencies_task_id_idx").on(table.taskId),
  dependsOnTaskIdIdx: index("task_dependencies_depends_on_task_id_idx").on(table.dependsOnTaskId),
}));

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
}));

export const taskNotifications = pgTable("task_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  sentOn: date("sent_on").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  taskKindDayIdx: uniqueIndex("task_notifications_task_kind_day").on(table.taskId, table.kind, table.sentOn),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type NewBudgetCategory = typeof budgetCategories.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;
export type TaskColumn = typeof taskColumns.$inferSelect;
export type NewTaskColumn = typeof taskColumns.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type TaskDependency = typeof taskDependencies.$inferSelect;
export type NewTaskDependency = typeof taskDependencies.$inferInsert;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type TaskNotification = typeof taskNotifications.$inferSelect;
export type NewTaskNotification = typeof taskNotifications.$inferInsert;

/** Base SINAPI global — não pertence a uma obra e não entra no CASCADE. */
export const kbSupplierCategories = pgTable("kb_supplier_categories", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kbMaterials = pgTable("kb_materials", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  categoryId: uuid("category_id").notNull().references(() => kbSupplierCategories.id, { onDelete: "restrict" }),
  sinapiCode: text("sinapi_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdIdx: index("kb_materials_category_id_idx").on(table.categoryId),
}));

export const kbModules = pgTable("kb_modules", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  quantityUnit: text("quantity_unit").notNull(),
  qtyFrom: text("qty_from").notNull(),
  isDemolition: boolean("is_demolition").notNull().default(false),
  extraLabel: text("extra_label"),
  extraKind: text("extra_kind"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kbCompositions = pgTable("kb_compositions", {
  id: uuid("id").primaryKey(),
  moduleId: uuid("module_id").notNull().references(() => kbModules.id, { onDelete: "cascade" }),
  materialId: uuid("material_id").notNull().references(() => kbMaterials.id, { onDelete: "restrict" }),
  consumption: numeric("consumption", { precision: 15, scale: 4 }).notNull(),
  wastePct: numeric("waste_pct", { precision: 8, scale: 2 }).notNull().default("0"),
  sinapiCode: text("sinapi_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  moduleIdIdx: index("kb_compositions_module_id_idx").on(table.moduleId),
  materialIdIdx: index("kb_compositions_material_id_idx").on(table.materialId),
}));

export const kbPackages = pgTable("kb_packages", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  defaultPoints: integer("default_points"),
  defaultWallM: numeric("default_wall_m", { precision: 10, scale: 2 }),
  defaultCount: integer("default_count"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kbPackageModules = pgTable("kb_package_modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  packageId: uuid("package_id").notNull().references(() => kbPackages.id, { onDelete: "cascade" }),
  moduleId: uuid("module_id").notNull().references(() => kbModules.id, { onDelete: "restrict" }),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => ({
  packageIdIdx: index("kb_package_modules_package_id_idx").on(table.packageId),
}));

export const projectRooms = pgTable("project_rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  areaM2: numeric("area_m2", { precision: 10, scale: 2 }).notNull().default("0"),
  widthM: numeric("width_m", { precision: 10, scale: 2 }),
  lengthM: numeric("length_m", { precision: 10, scale: 2 }),
  perimeterM: numeric("perimeter_m", { precision: 10, scale: 2 }),
  ceilingHeightM: numeric("ceiling_height_m", { precision: 10, scale: 2 }).notNull().default("2.70"),
  doors: integer("doors").notNull().default(1),
  windows: integer("windows").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index("project_rooms_project_id_idx").on(table.projectId),
}));

export const projectRoomModules = pgTable("project_room_modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").notNull().references(() => projectRooms.id, { onDelete: "cascade" }),
  moduleId: uuid("module_id").notNull().references(() => kbModules.id, { onDelete: "restrict" }),
  packageId: uuid("package_id").references(() => kbPackages.id, { onDelete: "set null" }),
  extraQty: numeric("extra_qty", { precision: 10, scale: 3 }).notNull().default("0"),
}, (table) => ({
  roomIdIdx: index("project_room_modules_room_id_idx").on(table.roomId),
}));

export const projectSuggestedItems = pgTable("project_suggested_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  kbMaterialId: uuid("kb_material_id").references(() => kbMaterials.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull(),
  categoryId: uuid("category_id").references(() => kbSupplierCategories.id, { onDelete: "set null" }),
  categoryName: text("category_name").notNull().default(""),
  source: text("source").notNull().default("suggested"),
  linkedMaterialId: uuid("linked_material_id").references(() => materials.id, { onDelete: "set null" }),
  sinapiCode: text("sinapi_code"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index("project_suggested_items_project_id_idx").on(table.projectId),
}));

export type KbSupplierCategory = typeof kbSupplierCategories.$inferSelect;
export type KbMaterial = typeof kbMaterials.$inferSelect;
export type KbModule = typeof kbModules.$inferSelect;
export type KbComposition = typeof kbCompositions.$inferSelect;
export type KbPackage = typeof kbPackages.$inferSelect;
export type ProjectRoom = typeof projectRooms.$inferSelect;
export type ProjectRoomModule = typeof projectRoomModules.$inferSelect;
export type ProjectSuggestedItem = typeof projectSuggestedItems.$inferSelect;
