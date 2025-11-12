import { eq, and, or, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  cptCodes, InsertCptCode, CptCode,
  payers, InsertPayer, Payer,
  plans, InsertPlan, Plan,
  rates, InsertRate, Rate,
  payerMultipliers, InsertPayerMultiplier, PayerMultiplier,
  scenarios, InsertScenario, Scenario,
  scenarioDetails, InsertScenarioDetail, ScenarioDetail
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== User Management =====
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== CPT Code Management =====
export async function getAllCptCodes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cptCodes).orderBy(cptCodes.code);
}

export async function getCptCodeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cptCodes).where(eq(cptCodes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCptCode(data: InsertCptCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cptCodes).values(data);
  return result;
}

export async function updateCptCode(id: number, data: Partial<InsertCptCode>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cptCodes).set(data).where(eq(cptCodes.id, id));
}

export async function deleteCptCode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cptCodes).where(eq(cptCodes.id, id));
}

// ===== Payer Management =====
export async function getAllPayers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payers).orderBy(payers.payerName);
}

export async function getPayerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payers).where(eq(payers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPayer(data: InsertPayer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payers).values(data);
  return result;
}

export async function updatePayer(id: number, data: Partial<InsertPayer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payers).set(data).where(eq(payers.id, id));
}

export async function deletePayer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(payers).where(eq(payers.id, id));
}

// ===== Plan Management =====
export async function getAllPlans() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(plans).orderBy(plans.planName);
}

export async function getPlansByPayerId(payerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(plans).where(eq(plans.payerId, payerId));
}

export async function createPlan(data: InsertPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(plans).values(data);
  return result;
}

export async function updatePlan(id: number, data: Partial<InsertPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(plans).set(data).where(eq(plans.id, id));
}

export async function deletePlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(plans).where(eq(plans.id, id));
}

// ===== Rate Management =====
export async function getAllRates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rates).orderBy(desc(rates.createdAt));
}

export async function getRateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rates).where(eq(rates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRatesByCptCode(cptCodeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rates).where(eq(rates.cptCodeId, cptCodeId));
}

export async function createRate(data: InsertRate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rates).values(data);
  return result;
}

export async function updateRate(id: number, data: Partial<InsertRate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rates).set(data).where(eq(rates.id, id));
}

export async function deleteRate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(rates).where(eq(rates.id, id));
}

// ===== Payer Multiplier Management =====
export async function getAllMultipliers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payerMultipliers);
}

export async function getMultiplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payerMultipliers).where(eq(payerMultipliers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMultiplier(data: InsertPayerMultiplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payerMultipliers).values(data);
  return result;
}

export async function updateMultiplier(id: number, data: Partial<InsertPayerMultiplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payerMultipliers).set(data).where(eq(payerMultipliers.id, id));
}

export async function deleteMultiplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(payerMultipliers).where(eq(payerMultipliers.id, id));
}

// ===== Scenario Management =====
export async function getAllScenarios(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(scenarios).where(eq(scenarios.userId, userId)).orderBy(desc(scenarios.createdAt));
}

export async function getScenarioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createScenario(data: InsertScenario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scenarios).values(data);
  return result;
}

export async function updateScenario(id: number, data: Partial<InsertScenario>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scenarios).set(data).where(eq(scenarios.id, id));
}

export async function deleteScenario(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scenarios).where(eq(scenarios.id, id));
}

// ===== Scenario Detail Management =====
export async function getScenarioDetails(scenarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(scenarioDetails).where(eq(scenarioDetails.scenarioId, scenarioId));
}

export async function createScenarioDetail(data: InsertScenarioDetail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scenarioDetails).values(data);
  return result;
}

export async function deleteScenarioDetails(scenarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scenarioDetails).where(eq(scenarioDetails.scenarioId, scenarioId));
}

// ===== Complex Queries =====
export async function getRatesWithDetails() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: rates.id,
      cptCode: cptCodes.code,
      cptDescription: cptCodes.description,
      payerName: payers.payerName,
      payerType: payers.payerType,
      planName: plans.planName,
      siteType: rates.siteType,
      component: rates.component,
      rate: rates.rate,
      verified: rates.verified,
      medicareBase: rates.medicareBase,
      notes: rates.notes,
    })
    .from(rates)
    .leftJoin(cptCodes, eq(rates.cptCodeId, cptCodes.id))
    .leftJoin(payers, eq(rates.payerId, payers.id))
    .leftJoin(plans, eq(rates.planId, plans.id))
    .orderBy(desc(rates.createdAt));
    
  return result;
}

export async function getScenarioWithDetails(scenarioId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const scenario = await getScenarioById(scenarioId);
  if (!scenario) return null;
  
  const details = await db
    .select({
      id: scenarioDetails.id,
      cptCodeId: scenarioDetails.cptCodeId,
      cptCode: cptCodes.code,
      cptDescription: cptCodes.description,
      quantity: scenarioDetails.quantity,
    })
    .from(scenarioDetails)
    .leftJoin(cptCodes, eq(scenarioDetails.cptCodeId, cptCodes.id))
    .where(eq(scenarioDetails.scenarioId, scenarioId));
    
  return {
    ...scenario,
    details,
  };
}
