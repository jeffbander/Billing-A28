import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../db';

describe('Institutions Management', () => {
  let testInstitutionId: number;

  it('should create a new institution', async () => {
    const institution = await db.createInstitution({
      name: 'Test Hospital',
      shortName: 'TH',
      active: true,
    });

    expect(institution).toBeDefined();
    expect(institution?.name).toBe('Test Hospital');
    expect(institution?.shortName).toBe('TH');
    expect(institution?.active).toBe(true);
    
    testInstitutionId = institution!.id;
  });

  it('should get all institutions', async () => {
    const institutions = await db.getAllInstitutions();
    
    expect(institutions).toBeDefined();
    expect(Array.isArray(institutions)).toBe(true);
    expect(institutions.length).toBeGreaterThan(0);
  });

  it('should get institution by id', async () => {
    const institution = await db.getInstitutionById(testInstitutionId);
    
    expect(institution).toBeDefined();
    expect(institution?.id).toBe(testInstitutionId);
    expect(institution?.name).toBe('Test Hospital');
  });

  it('should update institution', async () => {
    const updated = await db.updateInstitution(testInstitutionId, {
      name: 'Updated Test Hospital',
      shortName: 'UTH',
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe('Updated Test Hospital');
    expect(updated?.shortName).toBe('UTH');
  });

  it('should get active institutions only', async () => {
    const activeInstitutions = await db.getActiveInstitutions();
    
    expect(activeInstitutions).toBeDefined();
    expect(Array.isArray(activeInstitutions)).toBe(true);
    expect(activeInstitutions.every(i => i.active)).toBe(true);
  });

  it('should delete institution', async () => {
    const success = await db.deleteInstitution(testInstitutionId);
    
    expect(success).toBe(true);
    
    const deleted = await db.getInstitutionById(testInstitutionId);
    expect(deleted).toBeUndefined();
  });
});

describe('Providers Management', () => {
  let testInstitutionId: number;
  let testProviderId: number;

  beforeAll(async () => {
    // Create test institution for provider tests
    const institution = await db.createInstitution({
      name: 'Test Institution for Providers',
      shortName: 'TIP',
      active: true,
    });
    testInstitutionId = institution!.id;
  });

  afterAll(async () => {
    // Clean up test institution
    await db.deleteInstitution(testInstitutionId);
  });

  it('should create a new provider', async () => {
    const provider = await db.createProvider({
      name: 'Dr. Test Provider',
      providerType: 'Type1',
      homeInstitutionId: testInstitutionId,
      active: true,
      notes: 'Test provider for unit testing',
    });

    expect(provider).toBeDefined();
    expect(provider?.name).toBe('Dr. Test Provider');
    expect(provider?.providerType).toBe('Type1');
    expect(provider?.homeInstitutionId).toBe(testInstitutionId);
    expect(provider?.active).toBe(true);
    
    testProviderId = provider!.id;
  });

  it('should get all providers', async () => {
    const providers = await db.getAllProviders();
    
    expect(providers).toBeDefined();
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
  });

  it('should get provider by id', async () => {
    const provider = await db.getProviderById(testProviderId);
    
    expect(provider).toBeDefined();
    expect(provider?.id).toBe(testProviderId);
    expect(provider?.name).toBe('Dr. Test Provider');
  });

  it('should get providers by institution', async () => {
    const providers = await db.getProvidersByInstitution(testInstitutionId);
    
    expect(providers).toBeDefined();
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
    expect(providers.every(p => p.homeInstitutionId === testInstitutionId)).toBe(true);
  });

  it('should update provider', async () => {
    const updated = await db.updateProvider(testProviderId, {
      name: 'Dr. Updated Provider',
      providerType: 'Type2',
      notes: 'Updated notes',
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe('Dr. Updated Provider');
    expect(updated?.providerType).toBe('Type2');
    expect(updated?.notes).toBe('Updated notes');
  });

  it('should get active providers only', async () => {
    const activeProviders = await db.getActiveProviders();
    
    expect(activeProviders).toBeDefined();
    expect(Array.isArray(activeProviders)).toBe(true);
    expect(activeProviders.every(p => p.active)).toBe(true);
  });

  it('should handle different provider types', async () => {
    const type2Provider = await db.createProvider({
      name: 'Dr. Type 2 Provider',
      providerType: 'Type2',
      homeInstitutionId: testInstitutionId,
      active: true,
    });

    const type3Provider = await db.createProvider({
      name: 'Dr. Type 3 Provider',
      providerType: 'Type3',
      homeInstitutionId: testInstitutionId,
      active: true,
    });

    expect(type2Provider?.providerType).toBe('Type2');
    expect(type3Provider?.providerType).toBe('Type3');

    // Clean up
    await db.deleteProvider(type2Provider!.id);
    await db.deleteProvider(type3Provider!.id);
  });

  it('should delete provider', async () => {
    const success = await db.deleteProvider(testProviderId);
    
    expect(success).toBe(true);
    
    const deleted = await db.getProviderById(testProviderId);
    expect(deleted).toBeUndefined();
  });
});

describe('Provider Types Business Logic', () => {
  let institutionMSW: number;
  let institutionMSH: number;
  let provider1: number;
  let provider2: number;
  let provider3: number;

  beforeAll(async () => {
    // Create test institutions with unique names
    const timestamp = Date.now();
    const msw = await db.createInstitution({
      name: `Test MSW Article 28 ${timestamp}`,
      shortName: `MSW${timestamp}`,
      active: true,
    });
    const msh = await db.createInstitution({
      name: `Test MSH ${timestamp}`,
      shortName: `MSH${timestamp}`,
      active: true,
    });
    
    institutionMSW = msw!.id;
    institutionMSH = msh!.id;

    // Create test providers
    const p1 = await db.createProvider({
      name: 'Dr. Crystal Engstrom',
      providerType: 'Type1',
      homeInstitutionId: institutionMSW,
      active: true,
      notes: 'Type 1 - Article 28 Provider',
    });

    const p2 = await db.createProvider({
      name: 'Dr. Jeffrey Bander',
      providerType: 'Type2',
      homeInstitutionId: institutionMSH,
      active: true,
      notes: 'Type 2 - Visiting Provider from MSH',
    });

    const p3 = await db.createProvider({
      name: 'Dr. Smith',
      providerType: 'Type3',
      homeInstitutionId: institutionMSH,
      active: true,
      notes: 'Type 3 - Referring Provider',
    });

    provider1 = p1!.id;
    provider2 = p2!.id;
    provider3 = p3!.id;
  });

  afterAll(async () => {
    // Clean up
    await db.deleteProvider(provider1);
    await db.deleteProvider(provider2);
    await db.deleteProvider(provider3);
    await db.deleteInstitution(institutionMSW);
    await db.deleteInstitution(institutionMSH);
  });

  it('should correctly identify Type 1 provider attributes', async () => {
    const provider = await db.getProviderById(provider1);
    
    expect(provider?.providerType).toBe('Type1');
    expect(provider?.homeInstitutionId).toBe(institutionMSW);
    // Type 1: Professional $ + RVUs stay at home institution (Article 28)
  });

  it('should correctly identify Type 2 provider attributes', async () => {
    const provider = await db.getProviderById(provider2);
    
    expect(provider?.providerType).toBe('Type2');
    expect(provider?.homeInstitutionId).toBe(institutionMSH);
    // Type 2: Professional $ + RVUs go to home institution, Technical $ to facility
  });

  it('should correctly identify Type 3 provider attributes', async () => {
    const provider = await db.getProviderById(provider3);
    
    expect(provider?.providerType).toBe('Type3');
    // Type 3: Generates referrals only, no direct patient care
  });

  it('should get providers grouped by institution', async () => {
    const mswProviders = await db.getProvidersByInstitution(institutionMSW);
    const mshProviders = await db.getProvidersByInstitution(institutionMSH);

    expect(mswProviders.length).toBe(1);
    expect(mswProviders[0].providerType).toBe('Type1');

    expect(mshProviders.length).toBe(2);
    expect(mshProviders.some(p => p.providerType === 'Type2')).toBe(true);
    expect(mshProviders.some(p => p.providerType === 'Type3')).toBe(true);
  });
});
