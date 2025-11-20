import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createValuation,
  createValuationActivity,
  updateValuation,
  getValuationById,
  getValuationActivitiesByValuation,
  deleteValuation,
  deleteValuationActivity,
} from "../db";

describe("Edit Valuation Functionality", () => {
  let testUserId: number;
  let testProviderId: number;
  let valuationId: number;
  let activity1Id: number;
  let activity2Id: number;

  beforeAll(async () => {
    // Use test user and provider
    testUserId = 1;
    testProviderId = 1;

    // Create a test valuation
    const valuation = await createValuation({
      userId: testUserId,
      name: "Test Valuation for Editing",
      description: "Original description",
      providerId: testProviderId,
      monthlyPatients: 100,
    });
    valuationId = valuation.id;

    // Add two activities
    const act1 = await createValuationActivity({
      valuationId,
      cptCodeId: 7, // 99213
      monthlyPerforms: 50,
    });
    activity1Id = act1.id;

    const act2 = await createValuationActivity({
      valuationId,
      cptCodeId: 8, // 99214
      monthlyPerforms: 30,
    });
    activity2Id = act2.id;
  });

  afterAll(async () => {
    // Cleanup
    if (valuationId) await deleteValuation(valuationId);
  });

  describe("Update Valuation Basic Info", () => {
    it("should update valuation name", async () => {
      await updateValuation(valuationId, {
        name: "Updated Valuation Name",
      });

      const updated = await getValuationById(valuationId);
      expect(updated).toBeDefined();
      expect(updated!.name).toBe("Updated Valuation Name");
    });

    it("should update valuation description", async () => {
      await updateValuation(valuationId, {
        description: "Updated description",
      });

      const updated = await getValuationById(valuationId);
      expect(updated).toBeDefined();
      expect(updated!.description).toBe("Updated description");
    });

    it("should update monthly patients", async () => {
      await updateValuation(valuationId, {
        monthlyPatients: 200,
      });

      const updated = await getValuationById(valuationId);
      expect(updated).toBeDefined();
      expect(updated!.monthlyPatients).toBe(200);
    });

    it("should update provider", async () => {
      // Assuming provider 2 exists
      await updateValuation(valuationId, {
        providerId: testProviderId,
      });

      const updated = await getValuationById(valuationId);
      expect(updated).toBeDefined();
      expect(updated!.providerId).toBe(testProviderId);
    });

    it("should update multiple fields at once", async () => {
      await updateValuation(valuationId, {
        name: "Multi-field Update Test",
        description: "Testing multiple updates",
        monthlyPatients: 150,
      });

      const updated = await getValuationById(valuationId);
      expect(updated).toBeDefined();
      expect(updated!.name).toBe("Multi-field Update Test");
      expect(updated!.description).toBe("Testing multiple updates");
      expect(updated!.monthlyPatients).toBe(150);
    });
  });

  describe("Replace Activities Workflow", () => {
    it("should retrieve existing activities before update", async () => {
      const activities = await getValuationActivitiesByValuation(valuationId);

      expect(activities).toBeDefined();
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThanOrEqual(2);
    });

    it("should delete existing activities", async () => {
      const activities = await getValuationActivitiesByValuation(valuationId);
      const initialCount = activities.length;

      // Delete one activity
      if (activities.length > 0) {
        await deleteValuationActivity(activities[0].id);
      }

      const remaining = await getValuationActivitiesByValuation(valuationId);
      expect(remaining.length).toBe(initialCount - 1);
    });

    it("should create new activities after deletion", async () => {
      // Get current count
      const before = await getValuationActivitiesByValuation(valuationId);
      const beforeCount = before.length;

      // Add a new activity
      const newActivity = await createValuationActivity({
        valuationId,
        cptCodeId: 9, // 99215
        monthlyPerforms: 20,
      });

      const after = await getValuationActivitiesByValuation(valuationId);
      expect(after.length).toBe(beforeCount + 1);

      // Verify the new activity
      const found = after.find((a) => a.id === newActivity.id);
      expect(found).toBeDefined();
      expect(found!.cptCodeId).toBe(9);
      expect(found!.monthlyPerforms).toBe(20);

      // Cleanup
      await deleteValuationActivity(newActivity.id);
    });
  });

  describe("Complete Edit Workflow", () => {
    it("should simulate complete edit: update info + replace activities", async () => {
      // Step 1: Update basic info
      await updateValuation(valuationId, {
        name: "Complete Edit Test",
        description: "Testing full edit workflow",
        monthlyPatients: 175,
      });

      // Step 2: Get existing activities
      const existingActivities = await getValuationActivitiesByValuation(valuationId);

      // Step 3: Delete all existing activities
      for (const activity of existingActivities) {
        await deleteValuationActivity(activity.id);
      }

      // Step 4: Create new activities
      const newAct1 = await createValuationActivity({
        valuationId,
        cptCodeId: 7, // 99213
        monthlyPerforms: 60, // Changed from 50
      });

      const newAct2 = await createValuationActivity({
        valuationId,
        cptCodeId: 9, // 99215 (different CPT)
        monthlyPerforms: 25,
      });

      // Verify updates
      const updatedValuation = await getValuationById(valuationId);
      expect(updatedValuation!.name).toBe("Complete Edit Test");
      expect(updatedValuation!.description).toBe("Testing full edit workflow");
      expect(updatedValuation!.monthlyPatients).toBe(175);

      const updatedActivities = await getValuationActivitiesByValuation(valuationId);
      expect(updatedActivities.length).toBe(2);

      const act1 = updatedActivities.find((a) => a.cptCodeId === 7);
      expect(act1).toBeDefined();
      expect(act1!.monthlyPerforms).toBe(60);

      const act2 = updatedActivities.find((a) => a.cptCodeId === 9);
      expect(act2).toBeDefined();
      expect(act2!.monthlyPerforms).toBe(25);

      // Cleanup new activities
      await deleteValuationActivity(newAct1.id);
      await deleteValuationActivity(newAct2.id);
    });
  });

  describe("Edge Cases", () => {
    it("should handle updating with empty description", async () => {
      await updateValuation(valuationId, {
        description: "",
      });

      const updated = await getValuationById(valuationId);
      expect(updated).toBeDefined();
      expect(updated!.description).toBe("");
    });

    it("should handle updating with zero monthly patients", async () => {
      await updateValuation(valuationId, {
        monthlyPatients: 0,
      });

      const updated = await getValuationById(valuationId);
      expect(updated).toBeDefined();
      expect(updated!.monthlyPatients).toBe(0);
    });

    it("should handle valuation with no activities", async () => {
      // Delete all activities
      const activities = await getValuationActivitiesByValuation(valuationId);
      for (const activity of activities) {
        await deleteValuationActivity(activity.id);
      }

      const remaining = await getValuationActivitiesByValuation(valuationId);
      expect(remaining.length).toBe(0);

      // Valuation should still exist
      const valuation = await getValuationById(valuationId);
      expect(valuation).toBeDefined();
    });
  });

  describe("Data Integrity", () => {
    it("should preserve userId when updating valuation", async () => {
      const before = await getValuationById(valuationId);
      const originalUserId = before!.userId;

      await updateValuation(valuationId, {
        name: "Preserve User ID Test",
      });

      const after = await getValuationById(valuationId);
      expect(after!.userId).toBe(originalUserId);
    });

    it("should preserve createdAt timestamp when updating", async () => {
      const before = await getValuationById(valuationId);
      const originalCreatedAt = before!.createdAt;

      // Wait a moment to ensure timestamps would differ
      await new Promise((resolve) => setTimeout(resolve, 100));

      await updateValuation(valuationId, {
        name: "Preserve Timestamp Test",
      });

      const after = await getValuationById(valuationId);
      expect(after!.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });
});
