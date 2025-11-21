import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from '../routers';
import type { Context } from '../_core/context';
import { getDb } from '../db';
import { institutions, providers, sites, valuations, valuationActivities } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Mock context for testing
const createMockContext = (userId: number = 1, role: 'admin' | 'user' = 'admin'): Context => ({
  user: {
    id: userId,
    openId: 'test-open-id',
    name: 'Test User',
    email: 'test@example.com',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: 'test',
  },
  req: {} as any,
  res: {} as any,
});

describe('Sites Management and Revenue Attribution', () => {
  let testInstitutionId: number;
  let testFpaSiteId: number;
  let testArticle28SiteId: number;
  let testProviderId: number;
  let testValuationId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test institution
    const [instResult] = await db.insert(institutions).values({
      name: 'Test Institution for Sites',
      type: 'Hospital',
      active: true,
    });
    testInstitutionId = Number(instResult.insertId);

    // Create test provider
    const [provResult] = await db.insert(providers).values({
      name: 'Test Provider Sites',
      providerType: 'Type1',
      homeInstitutionId: testInstitutionId,
      active: true,
    });
    testProviderId = Number(provResult.insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testValuationId) {
      await db.delete(valuationActivities).where(eq(valuationActivities.valuationId, testValuationId));
      await db.delete(valuations).where(eq(valuations.id, testValuationId));
    }
    if (testProviderId) {
      await db.delete(providers).where(eq(providers.id, testProviderId));
    }
    if (testFpaSiteId) {
      await db.delete(sites).where(eq(sites.id, testFpaSiteId));
    }
    if (testArticle28SiteId) {
      await db.delete(sites).where(eq(sites.id, testArticle28SiteId));
    }
    if (testInstitutionId) {
      await db.delete(institutions).where(eq(institutions.id, testInstitutionId));
    }
  });

  describe('Sites CRUD Operations', () => {
    it('should create an FPA site', async () => {
      const caller = appRouter.createCaller(createMockContext());
      const site = await caller.admin.createSite({
        name: 'Test FPA Site',
        siteType: 'FPA',
        institutionId: testInstitutionId,
      });

      expect(site).toBeDefined();
      expect(site.name).toBe('Test FPA Site');
      expect(site.siteType).toBe('FPA');
      expect(site.institutionId).toBe(testInstitutionId);
      expect(site.active).toBe(true);

      testFpaSiteId = site.id;
    });

    it('should create an Article 28 site', async () => {
      const caller = appRouter.createCaller(createMockContext());
      const site = await caller.admin.createSite({
        name: 'Test Article 28 Site',
        siteType: 'Article28',
        institutionId: testInstitutionId,
      });

      expect(site).toBeDefined();
      expect(site.name).toBe('Test Article 28 Site');
      expect(site.siteType).toBe('Article28');
      expect(site.institutionId).toBe(testInstitutionId);

      testArticle28SiteId = site.id;
    });

    it('should list all sites', async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sites = await caller.admin.listSites();

      expect(sites.length).toBeGreaterThanOrEqual(2);
      const testSites = sites.filter(s => s.institutionId === testInstitutionId);
      expect(testSites.length).toBe(2);
    });

    it('should get sites by institution', async () => {
      const caller = appRouter.createCaller(createMockContext());
      const sites = await caller.admin.getSitesByInstitution({ institutionId: testInstitutionId });

      expect(sites.length).toBe(2);
      expect(sites.some(s => s.siteType === 'FPA')).toBe(true);
      expect(sites.some(s => s.siteType === 'Article28')).toBe(true);
    });

    it('should update a site', async () => {
      const caller = appRouter.createCaller(createMockContext());
      const updated = await caller.admin.updateSite({
        id: testFpaSiteId,
        name: 'Updated FPA Site Name',
      });

      expect(updated.name).toBe('Updated FPA Site Name');
      expect(updated.siteType).toBe('FPA'); // Should remain unchanged
    });

    it('should deactivate a site', async () => {
      const caller = appRouter.createCaller(createMockContext());
      await caller.admin.updateSite({
        id: testArticle28SiteId,
        active: false,
      });

      const sites = await caller.admin.listSites();
      const deactivated = sites.find(s => s.id === testArticle28SiteId);
      expect(deactivated?.active).toBe(false);

      // Reactivate for other tests
      await caller.admin.updateSite({
        id: testArticle28SiteId,
        active: true,
      });
    });
  });

  describe('Valuation with Institution and Site', () => {
    it('should create valuation with institution and site', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const valuation = await caller.valuations.create({
        name: 'Test Site Attribution Valuation',
        providerId: testProviderId,
        institutionId: testInstitutionId,
        siteId: testFpaSiteId,
        monthlyPatients: 100,
        activities: [], // Empty activities array for now
      });

      expect(valuation).toBeDefined();
      expect(valuation.institutionId).toBe(testInstitutionId);
      expect(valuation.siteId).toBe(testFpaSiteId);

      testValuationId = valuation.id;
    });

    it('should allow valuation without institution/site for backward compatibility', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const valuation = await caller.valuations.create({
        name: 'Test Legacy Valuation',
        providerId: testProviderId,
        monthlyPatients: 50,
        activities: [],
      });

      expect(valuation).toBeDefined();
      expect(valuation.institutionId).toBeNull();
      expect(valuation.siteId).toBeNull();

      // Clean up
      await caller.valuations.delete({ id: valuation.id });
    });
  });

  describe('Revenue Attribution Calculation', () => {
    it('should calculate earned vs attributed revenue for FPA site', async () => {
      const caller = appRouter.createCaller(createMockContext());
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Add imaging activity with orders and reads
      await db.insert(valuationActivities).values({
        valuationId: testValuationId,
        cptCodeId: 2, // CPT 93306 - Echocardiography
        monthlyOrders: 30,
        monthlyReads: 30,
      });

      const result = await caller.valuations.calculate({ id: testValuationId });

      expect(result).toBeDefined();
      expect(result.earnedProfessionalRevenue).toBeGreaterThan(0);
      expect(result.earnedTechnicalRevenue).toBeGreaterThan(0);
      expect(result.attributedProfessionalRevenue).toBeGreaterThan(0);
      expect(result.attributedTechnicalRevenue).toBeGreaterThan(0);
      
      // For FPA site, earned prof revenue should equal attributed (same provider reads and orders)
      expect(result.earnedProfessionalRevenue).toBe(result.attributedProfessionalRevenue);
      
      // Technical revenue should be earned by the site
      expect(result.earnedTechnicalRevenue).toBeGreaterThan(0);
    });

    it('should calculate RVUs correctly', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.valuations.calculate({ id: testValuationId });

      expect(result.earnedRVUs).toBeGreaterThan(0);
      expect(result.attributedRVUs).toBeGreaterThan(0);
      
      // RVUs should match revenue attribution pattern
      expect(result.earnedRVUs).toBe(result.attributedRVUs);
    });

    it('should include activity breakdown with orders and reads', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.valuations.calculate({ id: testValuationId });

      expect(result.activities).toBeDefined();
      expect(result.activities.length).toBeGreaterThan(0);
      
      const imagingActivity = result.activities[0];
      expect(imagingActivity.monthlyOrders).toBe(30);
      expect(imagingActivity.monthlyReads).toBe(30);
      expect(imagingActivity.earnedProfessionalRevenue).toBeGreaterThan(0);
      expect(imagingActivity.earnedTechnicalRevenue).toBeGreaterThan(0);
    });

    it('should handle Article 28 site calculations', async () => {
      const caller = appRouter.createCaller(createMockContext());
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Create new valuation with Article 28 site
      const valuation = await caller.valuations.create({
        name: 'Test Article 28 Valuation',
        providerId: testProviderId,
        institutionId: testInstitutionId,
        siteId: testArticle28SiteId,
        monthlyPatients: 100,
        activities: [],
      });

      // Add imaging activity
      await db.insert(valuationActivities).values({
        valuationId: valuation.id,
        cptCodeId: 2, // CPT 93306
        monthlyOrders: 20,
        monthlyReads: 20,
      });

      const result = await caller.valuations.calculate({ id: valuation.id });

      expect(result).toBeDefined();
      expect(result.earnedProfessionalRevenue).toBeGreaterThan(0);
      expect(result.earnedTechnicalRevenue).toBeGreaterThan(0);
      
      // For Article 28, both prof and tech components should be calculated
      expect(result.activities[0].earnedProfessionalRevenue).toBeGreaterThan(0);
      expect(result.activities[0].earnedTechnicalRevenue).toBeGreaterThan(0);

      // Clean up
      await db.delete(valuationActivities).where(eq(valuationActivities.valuationId, valuation.id));
      await caller.valuations.delete({ id: valuation.id });
    });
  });

  describe('Provider Primary Site', () => {
    it('should update provider primary site', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const updated = await caller.admin.updateProvider({
        id: testProviderId,
        primarySiteId: testFpaSiteId,
      });

      expect(updated.primarySiteId).toBe(testFpaSiteId);
    });

    it('should allow null primary site', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const updated = await caller.admin.updateProvider({
        id: testProviderId,
        primarySiteId: null,
      });

      expect(updated.primarySiteId).toBeNull();
    });
  });
});
