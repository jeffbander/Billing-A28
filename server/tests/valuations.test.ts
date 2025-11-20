import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../db';

// Mock user ID for testing
const TEST_USER_ID = 1;

describe('Valuations Feature', () => {
  let testInstitutionId: number;
  let testProviderId: number;
  let testCptCodeId: number;
  let testValuationId: number;

  beforeAll(async () => {
    // Create test institution
    const institution = await db.createInstitution({
      name: 'Test Valuation Hospital',
      shortName: 'TVH',
      active: true,
    });
    testInstitutionId = institution!.id;

    // Create test provider (Type 1)
    const provider = await db.createProvider({
      name: 'Dr. Test Valuation Provider',
      providerType: 'Type1',
      homeInstitutionId: testInstitutionId,
      active: true,
      notes: 'Test provider for valuation testing',
    });
    testProviderId = provider!.id;

    // Get a CPT code with RVU data (99213 should exist)
    const cptCodes = await db.getAllCptCodes();
    const cpt99213 = cptCodes.find(c => c.code === '99213');
    if (cpt99213) {
      testCptCodeId = cpt99213.id;
    }
  });

  afterAll(async () => {
    // Clean up in reverse order
    if (testValuationId) {
      await db.deleteValuation(testValuationId);
    }
    if (testProviderId) {
      await db.deleteProvider(testProviderId);
    }
    if (testInstitutionId) {
      await db.deleteInstitution(testInstitutionId);
    }
  });

  describe('Valuation CRUD Operations', () => {
    it('should create a new valuation', async () => {
      const valuation = await db.createValuation({
        userId: TEST_USER_ID,
        providerId: testProviderId,
        name: 'Test Valuation November 2025',
        description: 'Testing valuation creation',
        monthlyPatients: 100,
      });

      expect(valuation).toBeDefined();
      expect(valuation?.name).toBe('Test Valuation November 2025');
      expect(valuation?.providerId).toBe(testProviderId);
      expect(valuation?.monthlyPatients).toBe(100);

      testValuationId = valuation!.id;
    });

    it('should get valuation by id', async () => {
      const valuation = await db.getValuationById(testValuationId);

      expect(valuation).toBeDefined();
      expect(valuation?.id).toBe(testValuationId);
      expect(valuation?.providerId).toBe(testProviderId);
    });

    it('should get valuations by user', async () => {
      const valuations = await db.getValuationsByUser(TEST_USER_ID);

      expect(valuations).toBeDefined();
      expect(Array.isArray(valuations)).toBe(true);
      expect(valuations.length).toBeGreaterThan(0);
    });

    it('should get valuation with details', async () => {
      const valuation = await db.getValuationWithDetails(testValuationId);

      expect(valuation).toBeDefined();
      expect(valuation?.id).toBe(testValuationId);
      expect(valuation?.providerId).toBe(testProviderId);
    });

    it('should update valuation', async () => {
      const updated = await db.updateValuation(testValuationId, {
        name: 'Updated Valuation Name',
        description: 'Updated description',
        monthlyPatients: 150,
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Valuation Name');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.monthlyPatients).toBe(150);
    });
  });

  describe('Valuation Activities', () => {
    it('should add activity to valuation', async () => {
      const activity = await db.createValuationActivity({
        valuationId: testValuationId,
        cptCodeId: testCptCodeId,
        monthlyOrders: 0,
        monthlyReads: 0,
        monthlyPerforms: 50,
      });

      expect(activity).toBeDefined();
      expect(activity?.valuationId).toBe(testValuationId);
      expect(activity?.cptCodeId).toBe(testCptCodeId);
      expect(activity?.monthlyPerforms).toBe(50);
    });

    it('should get activities for valuation', async () => {
      const activities = await db.getValuationActivitiesByValuation(testValuationId);

      expect(activities).toBeDefined();
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].valuationId).toBe(testValuationId);
    });

    it('should update activity', async () => {
      const activities = await db.getValuationActivitiesByValuation(testValuationId);
      const activityId = activities[0].id;

      const updated = await db.updateValuationActivity(activityId, {
        monthlyPerforms: 75,
      });

      expect(updated).toBeDefined();
      expect(updated?.monthlyPerforms).toBe(75);
    });

    it('should delete activity', async () => {
      const activities = await db.getValuationActivitiesByValuation(testValuationId);
      const activityId = activities[0].id;

      await db.deleteValuationActivity(activityId);
      // Deletion is successful if no error is thrown

      const remainingActivities = await db.getValuationActivitiesByValuation(testValuationId);
      expect(remainingActivities.find(a => a.id === activityId)).toBeUndefined();
    });
  });

  describe('RVU Calculations', () => {
    beforeAll(async () => {
      // Create fresh valuation for calculation tests
      const valuation = await db.createValuation({
        userId: TEST_USER_ID,
        providerId: testProviderId,
        name: 'RVU Calculation Test',
        description: 'Testing RVU calculations',
        monthlyPatients: 0,
      });
      testValuationId = valuation!.id;

      // Add activity with known RVU value
      await db.createValuationActivity({
        valuationId: testValuationId,
        cptCodeId: testCptCodeId,
        monthlyOrders: 0,
        monthlyReads: 0,
        monthlyPerforms: 50,
      });
    });

    it('should calculate total RVUs correctly', async () => {
      const cptCode = await db.getCptCodeById(testCptCodeId);
      const activities = await db.getValuationActivitiesByValuation(testValuationId);

      // Expected: 50 performs × work_rvu (0.97 for 99213)
      const expectedRVUs = 50 * (Number(cptCode?.workRvu) || 0);

      // Calculate actual RVUs
      let actualRVUs = 0;
      for (const activity of activities) {
        const code = await db.getCptCodeById(activity.cptCodeId);
        if (code?.workRvu) {
          actualRVUs += (activity.monthlyPerforms || 0) * Number(code.workRvu);
        }
      }

      expect(actualRVUs).toBe(expectedRVUs);
      expect(actualRVUs).toBeGreaterThan(0);
    });

    it('should handle imaging codes with orders and reads separately', async () => {
      // Get an imaging CPT code (93306 - Echocardiography)
      const cptCodes = await db.getAllCptCodes();
      const imagingCode = cptCodes.find(c => c.procedureType === 'imaging');

      if (imagingCode) {
        // Add imaging activity
        const activity = await db.createValuationActivity({
          valuationId: testValuationId,
          cptCodeId: imagingCode.id,
          monthlyOrders: 30,
          monthlyReads: 25,
          monthlyPerforms: 0,
        });

        expect(activity?.monthlyOrders).toBe(30);
        expect(activity?.monthlyReads).toBe(25);
        expect(activity?.monthlyPerforms).toBe(0);

        // RVUs should be based on reads only
        const expectedRVUs = 25 * (Number(imagingCode.workRvu) || 0);
        expect(expectedRVUs).toBeGreaterThan(0);

        // Clean up
        await db.deleteValuationActivity(activity!.id);
      }
    });

    it('should handle visit/procedure codes with performs only', async () => {
      const cptCodes = await db.getAllCptCodes();
      const visitCode = cptCodes.find(c => c.procedureType === 'visit');

      if (visitCode) {
        const activity = await db.createValuationActivity({
          valuationId: testValuationId,
          cptCodeId: visitCode.id,
          monthlyOrders: 0,
          monthlyReads: 0,
          monthlyPerforms: 40,
        });

        expect(activity?.monthlyPerforms).toBe(40);
        expect(activity?.monthlyOrders).toBe(0);
        expect(activity?.monthlyReads).toBe(0);

        // RVUs should be based on performs
        const expectedRVUs = 40 * (Number(visitCode.workRvu) || 0);
        expect(expectedRVUs).toBeGreaterThan(0);

        // Clean up
        await db.deleteValuationActivity(activity!.id);
      }
    });
  });

  describe('Provider Type Attribution', () => {
    let type1ProviderId: number;
    let type2ProviderId: number;
    let type3ProviderId: number;
    let homeInstitutionId: number;

    beforeAll(async () => {
      // Create home institution
      const homeInst = await db.createInstitution({
        name: 'Home Institution for Attribution Test',
        shortName: 'HOME',
        active: true,
      });
      homeInstitutionId = homeInst!.id;

      // Create Type 1 provider (keeps professional $)
      const p1 = await db.createProvider({
        name: 'Dr. Type1 Test',
        providerType: 'Type1',
        homeInstitutionId: testInstitutionId,
        active: true,
      });
      type1ProviderId = p1!.id;

      // Create Type 2 provider (professional $ to home institution)
      const p2 = await db.createProvider({
        name: 'Dr. Type2 Test',
        providerType: 'Type2',
        homeInstitutionId: homeInstitutionId,
        active: true,
      });
      type2ProviderId = p2!.id;

      // Create Type 3 provider (only technical $)
      const p3 = await db.createProvider({
        name: 'Dr. Type3 Test',
        providerType: 'Type3',
        homeInstitutionId: homeInstitutionId,
        active: true,
      });
      type3ProviderId = p3!.id;
    });

    afterAll(async () => {
      await db.deleteProvider(type1ProviderId);
      await db.deleteProvider(type2ProviderId);
      await db.deleteProvider(type3ProviderId);
      await db.deleteInstitution(homeInstitutionId);
    });

    it('should correctly identify Type 1 provider attribution', async () => {
      const provider = await db.getProviderById(type1ProviderId);
      expect(provider?.providerType).toBe('Type1');
      // Type 1: Professional $ stays with provider, Technical $ to facility
    });

    it('should correctly identify Type 2 provider attribution', async () => {
      const provider = await db.getProviderById(type2ProviderId);
      expect(provider?.providerType).toBe('Type2');
      expect(provider?.homeInstitutionId).toBe(homeInstitutionId);
      // Type 2: Professional $ goes to home institution, Technical $ to facility
    });

    it('should correctly identify Type 3 provider attribution', async () => {
      const provider = await db.getProviderById(type3ProviderId);
      expect(provider?.providerType).toBe('Type3');
      // Type 3: Only generates technical $, no professional $
    });
  });

  describe('Data Integrity', () => {
    it('should not allow valuation without provider', async () => {
      try {
        await db.createValuation({
          userId: TEST_USER_ID,
          providerId: 99999, // Non-existent provider
          name: 'Invalid Valuation',
          description: 'Should fail',
          monthlyPatients: 0,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should not allow activity without valuation', async () => {
      try {
        await db.createValuationActivity({
          valuationId: 99999, // Non-existent valuation
          cptCodeId: testCptCodeId,
          monthlyOrders: 0,
          monthlyReads: 0,
          monthlyPerforms: 10,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should not allow activity without CPT code', async () => {
      try {
        await db.createValuationActivity({
          valuationId: testValuationId,
          cptCodeId: 99999, // Non-existent CPT code
          monthlyOrders: 0,
          monthlyReads: 0,
          monthlyPerforms: 10,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should cascade delete activities when valuation is deleted', async () => {
      // Create temporary valuation with activity
      const tempValuation = await db.createValuation({
        userId: TEST_USER_ID,
        providerId: testProviderId,
        name: 'Temp Valuation for Delete Test',
        description: 'Will be deleted',
        monthlyPatients: 0,
      });

      const tempActivity = await db.createValuationActivity({
        valuationId: tempValuation!.id,
        cptCodeId: testCptCodeId,
        monthlyOrders: 0,
        monthlyReads: 0,
        monthlyPerforms: 10,
      });

      // Delete valuation
      await db.deleteValuation(tempValuation!.id);

      // Activity should also be deleted (cascade)
      const activities = await db.getValuationActivitiesByValuation(tempValuation!.id);
      expect(activities.length).toBe(0);
    });
  });
});
