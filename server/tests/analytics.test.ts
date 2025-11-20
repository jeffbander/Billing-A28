import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "../db";

describe("Valuation Analytics", () => {
  let userId: number;
  let provider1Id: number;
  let provider2Id: number;
  let institutionId: number;
  let cptCode1Id: number;
  let cptCode2Id: number;
  let valuation1Id: number;
  let valuation2Id: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-analytics-user",
      name: "Analytics Test User",
      email: "analytics@test.com",
    });
    const user = await db.getUserByOpenId("test-analytics-user");
    userId = user!.id;

    // Create test institution
    const institution = await db.createInstitution({
      name: "Analytics Test Institution",
      institutionId: 77777,
      article28: true,
    });
    institutionId = institution.id;

    // Create test providers
    const prov1 = await db.createProvider({
      name: "Provider A",
      type: "Type1",
      homeInstitutionId: institutionId,
    });
    provider1Id = prov1.id;

    const prov2 = await db.createProvider({
      name: "Provider B",
      type: "Type1",
      homeInstitutionId: institutionId,
    });
    provider2Id = prov2.id;

    // Create test CPT codes
    const cpt1 = await db.createCptCode({
      code: "11111",
      description: "Analytics Test CPT 1",
      procedureType: "visit",
      workRvu: 2.0,
    });
    cptCode1Id = cpt1.id;

    const cpt2 = await db.createCptCode({
      code: "22222",
      description: "Analytics Test CPT 2",
      procedureType: "visit",
      workRvu: 3.0,
    });
    cptCode2Id = cpt2.id;

    // Create test valuations
    const val1 = await db.createValuation({
      userId,
      providerId: provider1Id,
      name: "Analytics Valuation 1",
      monthlyPatients: 100,
    });
    valuation1Id = val1.id;

    await db.createValuationActivity({
      valuationId: valuation1Id,
      cptCodeId: cptCode1Id,
      monthlyPerforms: 50, // 50 * 2.0 = 100 RVUs
      monthlyOrders: 0,
      monthlyReads: 0,
    });

    const val2 = await db.createValuation({
      userId,
      providerId: provider2Id,
      name: "Analytics Valuation 2",
      monthlyPatients: 150,
    });
    valuation2Id = val2.id;

    await db.createValuationActivity({
      valuationId: valuation2Id,
      cptCodeId: cptCode2Id,
      monthlyPerforms: 30, // 30 * 3.0 = 90 RVUs
      monthlyOrders: 0,
      monthlyReads: 0,
    });
  });

  afterAll(async () => {
    // Cleanup
    if (valuation1Id) {
      const activities1 = await db.getValuationActivitiesByValuation(valuation1Id);
      for (const activity of activities1) {
        await db.deleteValuationActivity(activity.id);
      }
      await db.deleteValuation(valuation1Id);
    }
    if (valuation2Id) {
      const activities2 = await db.getValuationActivitiesByValuation(valuation2Id);
      for (const activity of activities2) {
        await db.deleteValuationActivity(activity.id);
      }
      await db.deleteValuation(valuation2Id);
    }
    if (cptCode1Id) await db.deleteCptCode(cptCode1Id);
    if (cptCode2Id) await db.deleteCptCode(cptCode2Id);
    if (provider1Id) await db.deleteProvider(provider1Id);
    if (provider2Id) await db.deleteProvider(provider2Id);
    if (institutionId) await db.deleteInstitution(institutionId);
  });

  it("should calculate total RVUs correctly", async () => {
    const analytics = await db.getValuationAnalytics(userId);
    
    // 100 RVUs from valuation1 + 90 RVUs from valuation2 = 190 RVUs
    expect(analytics.summary.totalRvus).toBeGreaterThanOrEqual(190);
  });

  it("should calculate average RVUs per valuation", async () => {
    const analytics = await db.getValuationAnalytics(userId);
    
    expect(analytics.summary.avgRvusPerValuation).toBeGreaterThan(0);
    expect(analytics.summary.totalValuations).toBeGreaterThanOrEqual(2);
  });

  it("should track active providers", async () => {
    const analytics = await db.getValuationAnalytics(userId);
    
    expect(analytics.summary.activeProviders).toBeGreaterThanOrEqual(2);
  });

  it("should include provider productivity metrics", async () => {
    const analytics = await db.getValuationAnalytics(userId);
    
    expect(analytics.providerProductivity.length).toBeGreaterThanOrEqual(2);
    
    // Find our test providers
    const provA = analytics.providerProductivity.find(p => p.providerName === "Provider A");
    const provB = analytics.providerProductivity.find(p => p.providerName === "Provider B");
    
    expect(provA).toBeDefined();
    expect(provB).toBeDefined();
    
    if (provA) {
      expect(provA.totalRvus).toBeGreaterThanOrEqual(100);
      expect(provA.valuationCount).toBeGreaterThanOrEqual(1);
    }
    
    if (provB) {
      expect(provB.totalRvus).toBeGreaterThanOrEqual(90);
      expect(provB.valuationCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("should sort providers by total RVUs descending", async () => {
    const analytics = await db.getValuationAnalytics(userId);
    
    // Verify providers are sorted by RVUs (highest first)
    for (let i = 0; i < analytics.providerProductivity.length - 1; i++) {
      expect(analytics.providerProductivity[i].totalRvus).toBeGreaterThanOrEqual(
        analytics.providerProductivity[i + 1].totalRvus
      );
    }
  });

  it("should track CPT code usage", async () => {
    const analytics = await db.getValuationAnalytics(userId);
    
    expect(analytics.topCptCodes.length).toBeGreaterThan(0);
    
    // Find our test CPT codes
    const cpt1 = analytics.topCptCodes.find(c => c.code === "11111");
    const cpt2 = analytics.topCptCodes.find(c => c.code === "22222");
    
    expect(cpt1 || cpt2).toBeDefined();
    
    if (cpt1) {
      expect(cpt1.usageCount).toBeGreaterThanOrEqual(1);
      expect(cpt1.totalRvus).toBeGreaterThanOrEqual(100);
    }
    
    if (cpt2) {
      expect(cpt2.usageCount).toBeGreaterThanOrEqual(1);
      expect(cpt2.totalRvus).toBeGreaterThanOrEqual(90);
    }
  });

  it("should include revenue trends by month", async () => {
    const analytics = await db.getValuationAnalytics(userId);
    
    expect(analytics.revenueTrends.length).toBeGreaterThan(0);
    
    // Verify trends are sorted by month
    for (let i = 0; i < analytics.revenueTrends.length - 1; i++) {
      expect(analytics.revenueTrends[i].month.localeCompare(analytics.revenueTrends[i + 1].month)).toBeLessThanOrEqual(0);
    }
  });

  it("should calculate total revenue (professional + technical)", async () => {
    const analytics = await db.getValuationAnalytics(userId);
    
    expect(analytics.summary.totalRevenue).toBe(
      analytics.summary.totalProfessionalRevenue + analytics.summary.totalTechnicalRevenue
    );
  });

  it("should return empty analytics for user with no valuations", async () => {
    // Create a new user with no valuations
    await db.upsertUser({
      openId: "empty-analytics-user",
      name: "Empty User",
      email: "empty@test.com",
    });
    const emptyUser = await db.getUserByOpenId("empty-analytics-user");
    
    const analytics = await db.getValuationAnalytics(emptyUser!.id);
    
    expect(analytics.summary.totalRvus).toBe(0);
    expect(analytics.summary.totalValuations).toBe(0);
    expect(analytics.summary.activeProviders).toBe(0);
    expect(analytics.providerProductivity.length).toBe(0);
    expect(analytics.topCptCodes.length).toBe(0);
    expect(analytics.revenueTrends.length).toBe(0);
  });
});
