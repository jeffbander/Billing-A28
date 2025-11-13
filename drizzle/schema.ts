import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * CPT codes table - stores procedure codes and descriptions
 */
export const cptCodes = mysqlTable("cpt_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CptCode = typeof cptCodes.$inferSelect;
export type InsertCptCode = typeof cptCodes.$inferInsert;

/**
 * Payers table - stores insurance payer information
 */
export const payers = mysqlTable("payers", {
  id: int("id").autoincrement().primaryKey(),
  payerType: mysqlEnum("payerType", ["Medicare", "Medicaid", "Commercial"]).notNull(),
  payerName: varchar("payerName", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payer = typeof payers.$inferSelect;
export type InsertPayer = typeof payers.$inferInsert;

/**
 * Plans table - stores specific insurance plans
 */
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  payerId: int("payerId").notNull(),
  planName: varchar("planName", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

/**
 * Rates master table - centralized rate database
 * Stores rates per CPT, site type, component, and payer type
 * Each CPT code has 9 rates: 3 payer types × 3 components
 */
export const rates = mysqlTable("rates", {
  id: int("id").autoincrement().primaryKey(),
  cptCodeId: int("cptCodeId").notNull(),
  payerType: mysqlEnum("payerType", ["Medicare", "Commercial", "Medicaid"]).notNull(),
  siteType: mysqlEnum("siteType", ["FPA", "Article28"]).notNull(),
  component: mysqlEnum("component", ["Professional", "Technical", "Global"]).notNull(),
  rate: int("rate").notNull(), // Store as cents to avoid decimal issues
  verified: boolean("verified").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rate = typeof rates.$inferSelect;
export type InsertRate = typeof rates.$inferInsert;

/**
 * Payer multipliers table - default multipliers for payer types
 */
export const payerMultipliers = mysqlTable("payer_multipliers", {
  id: int("id").autoincrement().primaryKey(),
  payerId: int("payerId"),
  payerType: mysqlEnum("payerType", ["Medicare", "Medicaid", "Commercial"]),
  professionalMultiplier: int("professionalMultiplier").notNull(), // Store as basis points (e.g., 140 = 1.40x)
  technicalMultiplier: int("technicalMultiplier").notNull(),
  globalMultiplier: int("globalMultiplier").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayerMultiplier = typeof payerMultipliers.$inferSelect;
export type InsertPayerMultiplier = typeof payerMultipliers.$inferInsert;

/**
 * Scenarios table - stores user-created reimbursement scenarios
 */
export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  providerName: varchar("providerName", { length: 200 }).notNull(),
  totalPatients: int("totalPatients").notNull(),
  medicarePercent: int("medicarePercent").notNull(), // Store as integer percentage (e.g., 40 = 40%)
  commercialPercent: int("commercialPercent").notNull(),
  medicaidPercent: int("medicaidPercent").notNull(),
  siteType: mysqlEnum("siteType", ["FPA", "Article28"]).notNull(),
  fpaTotal: int("fpaTotal"), // Calculated total in cents
  article28Total: int("article28Total"), // Calculated total in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

/**
 * Scenario details table - stores procedure mix for each scenario
 */
export const scenarioDetails = mysqlTable("scenario_details", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: int("scenarioId").notNull(),
  cptCodeId: int("cptCodeId").notNull(),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScenarioDetail = typeof scenarioDetails.$inferSelect;
export type InsertScenarioDetail = typeof scenarioDetails.$inferInsert;
