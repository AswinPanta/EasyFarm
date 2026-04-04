import { pgTable, serial, text, varchar, timestamp, real, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const severityEnum = pgEnum("severity", ["healthy", "warning", "critical"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Scan records — stores each disease detection result
 */
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 64 }),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(),
  prediction: varchar("prediction", { length: 64 }).notNull(),
  confidence: real("confidence").notNull(),
  severity: severityEnum("severity").notNull(),
  confidenceBreakdown: jsonb("confidenceBreakdown"),
  notes: text("notes"),
  location: varchar("location", { length: 255 }),
  synced: text("synced").default("synced").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Scan = typeof scans.$inferSelect;
export type InsertScan = typeof scans.$inferInsert;