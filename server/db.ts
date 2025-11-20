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
  scenarioDetails, InsertScenarioDetail, ScenarioDetail,
  calculationSettings, InsertCalculationSettings, CalculationSettings,
  institutions, InsertInstitution, Institution,
  providers, InsertProvider, Provider,
  scenarioProviderActivities, InsertScenarioProviderActivity, ScenarioProviderActivity,
  valuations, InsertValuation, Valuation,
  valuationActivities, InsertValuationActivity, ValuationActivity
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
    // Bootstrap admin role
    const ADMIN_EMAIL = 'jeffrey_bander@post.harvard.edu';
    const isBootstrapAdmin = user.email === ADMIN_EMAIL || user.openId === ENV.ownerOpenId;
    
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (isBootstrapAdmin) {
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

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: 'admin' | 'user') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
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
  await db.insert(cptCodes).values(data);
  
  // Query for the newly created CPT code to get its ID
  const newCptCode = await db.select().from(cptCodes).where(eq(cptCodes.code, data.code)).limit(1);
  if (newCptCode.length === 0) throw new Error("Failed to retrieve newly created CPT code");
  const insertId = newCptCode[0].id;
  
  // Create 9 placeholder rates (3 payer types × 3 components)
  const payerTypes: Array<"Medicare" | "Commercial" | "Medicaid"> = ["Medicare", "Commercial", "Medicaid"];
  const siteTypes: Array<"FPA" | "Article28"> = ["FPA", "Article28"];
  const components: Array<"Professional" | "Technical" | "Global"> = ["Professional", "Technical", "Global"];
  
  const placeholderRates: InsertRate[] = [];
  
  for (const payerType of payerTypes) {
    // FPA Global
    placeholderRates.push({
      cptCodeId: insertId,
      payerType,
      siteType: "FPA",
      component: "Global",
      rate: 0,
      verified: false,
      notes: "Placeholder rate - needs to be updated",
    });
    
    // Article 28 Professional
    placeholderRates.push({
      cptCodeId: insertId,
      payerType,
      siteType: "Article28",
      component: "Professional",
      rate: 0,
      verified: false,
      notes: "Placeholder rate - needs to be updated",
    });
    
    // Article 28 Technical
    placeholderRates.push({
      cptCodeId: insertId,
      payerType,
      siteType: "Article28",
      component: "Technical",
      rate: 0,
      verified: false,
      notes: "Placeholder rate - needs to be updated",
    });
  }
  
  await db.insert(rates).values(placeholderRates);
  
  return { success: true, id: insertId };
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
  // Extract insertId from the result
  const insertId = (result as any)[0]?.insertId || (result as any).insertId;
  return { insertId: insertId ? Number(insertId) : undefined };
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
      cptCodeId: rates.cptCodeId,
      cptCode: cptCodes.code,
      cptDescription: cptCodes.description,
      payerType: rates.payerType,
      siteType: rates.siteType,
      component: rates.component,
      rate: rates.rate,
      verified: rates.verified,
      notes: rates.notes,
    })
    .from(rates)
    .leftJoin(cptCodes, eq(rates.cptCodeId, cptCodes.id))
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

// ===== Calculation Settings Management =====
export async function getCalculationSettings(): Promise<CalculationSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(calculationSettings).limit(1);
  return result[0];
}

export async function upsertCalculationSettings(data: {
  commercialTechnicalMultiplier: number;
  medicaidTechnicalMultiplier: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if settings exist
  const existing = await getCalculationSettings();
  
  if (existing) {
    // Update existing settings
    await db.update(calculationSettings)
      .set(data)
      .where(eq(calculationSettings.id, existing.id));
  } else {
    // Insert new settings
    await db.insert(calculationSettings).values(data);
  }
}

export async function initializeCalculationSettings(): Promise<void> {
  const existing = await getCalculationSettings();
  if (!existing) {
    await upsertCalculationSettings({
      commercialTechnicalMultiplier: 150, // 1.5x default
      medicaidTechnicalMultiplier: 80,    // 0.8x default
    });
  }
}

// ===== Institution Management =====
export async function getAllInstitutions(): Promise<Institution[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(institutions).orderBy(institutions.name);
  } catch (error) {
    console.error("[Database] Failed to get institutions:", error);
    return [];
  }
}

export async function getActiveInstitutions(): Promise<Institution[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(institutions)
      .where(eq(institutions.active, true))
      .orderBy(institutions.name);
  } catch (error) {
    console.error("[Database] Failed to get active institutions:", error);
    return [];
  }
}

export async function getInstitutionById(id: number): Promise<Institution | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(institutions).where(eq(institutions.id, id)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get institution:", error);
    return undefined;
  }
}

export async function createInstitution(institution: InsertInstitution): Promise<Institution | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.insert(institutions).values(institution);
    const insertId = Number(result[0].insertId);
    return await getInstitutionById(insertId);
  } catch (error) {
    console.error("[Database] Failed to create institution:", error);
    return undefined;
  }
}

export async function updateInstitution(id: number, updates: Partial<InsertInstitution>): Promise<Institution | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    await db.update(institutions).set(updates).where(eq(institutions.id, id));
    return await getInstitutionById(id);
  } catch (error) {
    console.error("[Database] Failed to update institution:", error);
    return undefined;
  }
}

export async function deleteInstitution(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(institutions).where(eq(institutions.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete institution:", error);
    return false;
  }
}

// ===== Provider Management =====
export async function getAllProviders(): Promise<Provider[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(providers).orderBy(providers.name);
  } catch (error) {
    console.error("[Database] Failed to get providers:", error);
    return [];
  }
}

export async function getActiveProviders(): Promise<Provider[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(providers)
      .where(eq(providers.active, true))
      .orderBy(providers.name);
  } catch (error) {
    console.error("[Database] Failed to get active providers:", error);
    return [];
  }
}

export async function getProviderById(id: number): Promise<Provider | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get provider:", error);
    return undefined;
  }
}

export async function getProvidersByInstitution(institutionId: number): Promise<Provider[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(providers)
      .where(eq(providers.homeInstitutionId, institutionId))
      .orderBy(providers.name);
  } catch (error) {
    console.error("[Database] Failed to get providers by institution:", error);
    return [];
  }
}

export async function createProvider(provider: InsertProvider): Promise<Provider | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    const result = await db.insert(providers).values(provider);
    const insertId = Number(result[0].insertId);
    return await getProviderById(insertId);
  } catch (error) {
    console.error("[Database] Failed to create provider:", error);
    return undefined;
  }
}

export async function updateProvider(id: number, updates: Partial<InsertProvider>): Promise<Provider | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  try {
    await db.update(providers).set(updates).where(eq(providers.id, id));
    return await getProviderById(id);
  } catch (error) {
    console.error("[Database] Failed to update provider:", error);
    return undefined;
  }
}

export async function deleteProvider(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(providers).where(eq(providers.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete provider:", error);
    return false;
  }
}


// ===== Valuations =====

export async function createValuation(data: InsertValuation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(valuations).values(data);
  return await getValuationById(Number(result[0].insertId));
}

export async function getValuationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(valuations).where(eq(valuations.id, id)).limit(1);
  return result[0];
}

export async function getValuationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(valuations)
    .where(eq(valuations.userId, userId))
    .orderBy(desc(valuations.createdAt));
}

export async function getValuationWithDetails(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const valuation = await getValuationById(id);
  if (!valuation) return undefined;
  
  const activities = await db.select().from(valuationActivities)
    .where(eq(valuationActivities.valuationId, id));
  
  return {
    ...valuation,
    activities,
  };
}

export async function updateValuation(id: number, data: Partial<InsertValuation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(valuations).set(data).where(eq(valuations.id, id));
  return await getValuationById(id);
}

export async function deleteValuation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete activities first
  await db.delete(valuationActivities).where(eq(valuationActivities.valuationId, id));
  // Then delete valuation
  await db.delete(valuations).where(eq(valuations.id, id));
}

// ===== Valuation Activities =====

export async function createValuationActivity(data: InsertValuationActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(valuationActivities).values(data);
  return await getValuationActivityById(Number(result[0].insertId));
}

export async function getValuationActivityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(valuationActivities)
    .where(eq(valuationActivities.id, id)).limit(1);
  return result[0];
}

export async function getValuationActivitiesByValuation(valuationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(valuationActivities)
    .where(eq(valuationActivities.valuationId, valuationId));
}

export async function updateValuationActivity(id: number, data: Partial<InsertValuationActivity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(valuationActivities).set(data).where(eq(valuationActivities.id, id));
  return await getValuationActivityById(id);
}

export async function deleteValuationActivity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(valuationActivities).where(eq(valuationActivities.id, id));
}
