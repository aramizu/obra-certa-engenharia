import { pgTable, text, timestamp, boolean, integer, uuid, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailNormalized: text("email_normalized").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
