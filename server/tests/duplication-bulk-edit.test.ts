import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "../db";

describe("Valuation Duplication", () => {
  let userId: number;
  let providerId: number;
  let institutionId: number;
  let cptCodeId: number;
  let originalValuationId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-dup-user",
      name: "Test Dup User",
      email: "dup@test.com",
    });
    const user = await db.getUserByOpenId("test-dup-user");
    userId = user!.id;

    // Create test institution
    const institution = await db.createInstitution({
      name: "Test Institution",
      institutionId: 99999,
      article28: true,
    });
    institutionId = institution.id;

    // Create test provider
    const provider = await db.createProvider({
      name: "Test Provider",
      type: "Type1",
      homeInstitutionId: institutionId,
    });
    providerId = provider.id;

    // Create test CPT code
    const cptCode = await db.createCptCode({
      code: "99999",
      description: "Test CPT",
      procedureType: "visit",
      workRvu: 1.5,
    });
    cptCodeId = cptCode.id;

    // Create original valuation
    const valuation = await db.createValuation({
      userId,
      providerId,
      name: "Original Valuation",
      description: "Test description",
      monthlyPatients: 100,
    });
    originalValuationId = valuation!.id;

    // Add activities to original
    await db.createValuationActivity({
      valuationId: originalValuationId,
      cptCodeId,
      monthlyPerforms: 50,
      monthlyOrders: 0,
      monthlyReads: 0,
    });
  });

  afterAll(async () => {
    // Cleanup
    if (originalValuationId) {
      const activities = await db.getValuationActivitiesByValuation(originalValuationId);
      for (const activity of activities) {
        await db.deleteValuationActivity(activity.id);
      }
      await db.deleteValuation(originalValuationId);
    }
    if (cptCodeId) await db.deleteCptCode(cptCodeId);
    if (providerId) await db.deleteProvider(providerId);
    if (institutionId) await db.deleteInstitution(institutionId);
  });

  it("should create a duplicate with 'Copy of' prefix", async () => {
    const duplicate = await db.duplicateValuation(originalValuationId, userId);
    
    expect(duplicate).toBeDefined();
    expect(duplicate.name).toBe("Copy of Original Valuation");
    expect(duplicate.providerId).toBe(providerId);
    expect(duplicate.monthlyPatients).toBe(100);
    expect(duplicate.description).toBe("Test description");
    
    // Cleanup
    if (duplicate) {
      const activities = await db.getValuationActivitiesByValuation(duplicate.id);
      for (const activity of activities) {
        await db.deleteValuationActivity(activity.id);
      }
      await db.deleteValuation(duplicate.id);
    }
  });

  it("should copy all activities from original", async () => {
    const duplicate = await db.duplicateValuation(originalValuationId, userId);
    const duplicateActivities = await db.getValuationActivitiesByValuation(duplicate.id);
    
    expect(duplicateActivities).toHaveLength(1);
    expect(duplicateActivities[0].cptCodeId).toBe(cptCodeId);
    expect(duplicateActivities[0].monthlyPerforms).toBe(50);
    
    // Cleanup
    for (const activity of duplicateActivities) {
      await db.deleteValuationActivity(activity.id);
    }
    await db.deleteValuation(duplicate.id);
  });

  it("should create independent copy (changes don't affect original)", async () => {
    const duplicate = await db.duplicateValuation(originalValuationId, userId);
    
    // Modify duplicate
    await db.updateValuation(duplicate.id, { name: "Modified Duplicate" });
    
    // Check original is unchanged
    const original = await db.getValuationById(originalValuationId);
    expect(original?.name).toBe("Original Valuation");
    
    // Cleanup
    const activities = await db.getValuationActivitiesByValuation(duplicate.id);
    for (const activity of activities) {
      await db.deleteValuationActivity(activity.id);
    }
    await db.deleteValuation(duplicate.id);
  });

  it("should assign duplicate to specified user", async () => {
    const duplicate = await db.duplicateValuation(originalValuationId, userId);
    
    expect(duplicate.userId).toBe(userId);
    
    // Cleanup
    const activities = await db.getValuationActivitiesByValuation(duplicate.id);
    for (const activity of activities) {
      await db.deleteValuationActivity(activity.id);
    }
    await db.deleteValuation(duplicate.id);
  });
});

describe("Bulk Edit Valuations", () => {
  let userId: number;
  let providerId: number;
  let institutionId: number;
  let cptCodeId1: number;
  let cptCodeId2: number;
  let valuation1Id: number;
  let valuation2Id: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-bulk-user",
      name: "Test Bulk User",
      email: "bulk@test.com",
    });
    const user = await db.getUserByOpenId("test-bulk-user");
    userId = user!.id;

    // Create test institution
    const institution = await db.createInstitution({
      name: "Bulk Test Institution",
      institutionId: 88888,
      article28: true,
    });
    institutionId = institution.id;

    // Create test provider
    const provider = await db.createProvider({
      name: "Bulk Test Provider",
      type: "Type1",
      homeInstitutionId: institutionId,
    });
    providerId = provider.id;

    // Create test CPT codes
    const cpt1 = await db.createCptCode({
      code: "88888",
      description: "Bulk Test CPT 1",
      procedureType: "visit",
      workRvu: 1.0,
    });
    cptCodeId1 = cpt1.id;

    const cpt2 = await db.createCptCode({
      code: "77777",
      description: "Bulk Test CPT 2",
      procedureType: "visit",
      workRvu: 2.0,
    });
    cptCodeId2 = cpt2.id;

    // Create two valuations with different activities
    const val1 = await db.createValuation({
      userId,
      providerId,
      name: "Bulk Valuation 1",
      monthlyPatients: 50,
    });
    valuation1Id = val1!.id;
    await db.createValuationActivity({
      valuationId: valuation1Id,
      cptCodeId: cptCodeId1,
      monthlyPerforms: 10,
      monthlyOrders: 0,
      monthlyReads: 0,
    });

    const val2 = await db.createValuation({
      userId,
      providerId,
      name: "Bulk Valuation 2",
      monthlyPatients: 75,
    });
    valuation2Id = val2!.id;
    await db.createValuationActivity({
      valuationId: valuation2Id,
      cptCodeId: cptCodeId1,
      monthlyPerforms: 20,
      monthlyOrders: 0,
      monthlyReads: 0,
    });
  });

  afterAll(async () => {
    // Cleanup
    if (valuation1Id) {
      const activities = await db.getValuationActivitiesByValuation(valuation1Id);
      for (const activity of activities) {
        await db.deleteValuationActivity(activity.id);
      }
      await db.deleteValuation(valuation1Id);
    }
    if (valuation2Id) {
      const activities = await db.getValuationActivitiesByValuation(valuation2Id);
      for (const activity of activities) {
        await db.deleteValuationActivity(activity.id);
      }
      await db.deleteValuation(valuation2Id);
    }
    if (cptCodeId1) await db.deleteCptCode(cptCodeId1);
    if (cptCodeId2) await db.deleteCptCode(cptCodeId2);
    if (providerId) await db.deleteProvider(providerId);
    if (institutionId) await db.deleteInstitution(institutionId);
  });

  it("should replace activities in all selected valuations", async () => {
    // Bulk update: replace all activities with new CPT code
    const newActivities = [
      {
        cptCodeId: cptCodeId2,
        monthlyPerforms: 30,
        monthlyOrders: 0,
        monthlyReads: 0,
      },
    ];

    // Simulate bulk update (delete old, create new)
    for (const valuationId of [valuation1Id, valuation2Id]) {
      const existingActivities = await db.getValuationActivitiesByValuation(valuationId);
      for (const activity of existingActivities) {
        await db.deleteValuationActivity(activity.id);
      }
      for (const activity of newActivities) {
        await db.createValuationActivity({
          valuationId,
          ...activity,
        });
      }
    }

    // Verify both valuations have new activities
    const val1Activities = await db.getValuationActivitiesByValuation(valuation1Id);
    const val2Activities = await db.getValuationActivitiesByValuation(valuation2Id);

    expect(val1Activities).toHaveLength(1);
    expect(val1Activities[0].cptCodeId).toBe(cptCodeId2);
    expect(val1Activities[0].monthlyPerforms).toBe(30);

    expect(val2Activities).toHaveLength(1);
    expect(val2Activities[0].cptCodeId).toBe(cptCodeId2);
    expect(val2Activities[0].monthlyPerforms).toBe(30);
  });

  it("should preserve valuation basic info during bulk edit", async () => {
    // Get original names
    const val1Before = await db.getValuationById(valuation1Id);
    const val2Before = await db.getValuationById(valuation2Id);

    // Bulk update activities
    const newActivities = [
      {
        cptCodeId: cptCodeId1,
        monthlyPerforms: 40,
        monthlyOrders: 0,
        monthlyReads: 0,
      },
    ];

    for (const valuationId of [valuation1Id, valuation2Id]) {
      const existingActivities = await db.getValuationActivitiesByValuation(valuationId);
      for (const activity of existingActivities) {
        await db.deleteValuationActivity(activity.id);
      }
      for (const activity of newActivities) {
        await db.createValuationActivity({
          valuationId,
          ...activity,
        });
      }
    }

    // Verify names and other info unchanged
    const val1After = await db.getValuationById(valuation1Id);
    const val2After = await db.getValuationById(valuation2Id);

    expect(val1After?.name).toBe(val1Before?.name);
    expect(val1After?.monthlyPatients).toBe(val1Before?.monthlyPatients);
    expect(val2After?.name).toBe(val2Before?.name);
    expect(val2After?.monthlyPatients).toBe(val2Before?.monthlyPatients);
  });

  it("should support adding multiple CPT codes in bulk", async () => {
    const newActivities = [
      {
        cptCodeId: cptCodeId1,
        monthlyPerforms: 15,
        monthlyOrders: 0,
        monthlyReads: 0,
      },
      {
        cptCodeId: cptCodeId2,
        monthlyPerforms: 25,
        monthlyOrders: 0,
        monthlyReads: 0,
      },
    ];

    for (const valuationId of [valuation1Id, valuation2Id]) {
      const existingActivities = await db.getValuationActivitiesByValuation(valuationId);
      for (const activity of existingActivities) {
        await db.deleteValuationActivity(activity.id);
      }
      for (const activity of newActivities) {
        await db.createValuationActivity({
          valuationId,
          ...activity,
        });
      }
    }

    // Verify both valuations have both CPT codes
    const val1Activities = await db.getValuationActivitiesByValuation(valuation1Id);
    const val2Activities = await db.getValuationActivitiesByValuation(valuation2Id);

    expect(val1Activities).toHaveLength(2);
    expect(val2Activities).toHaveLength(2);
  });
});
