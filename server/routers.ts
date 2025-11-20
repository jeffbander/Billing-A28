import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, guestOrAuthProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { 
  updateSessionRate, getSessionId, getSessionRate, getAllSessionRates,
  createSessionScenario, getAllSessionScenarios, getSessionScenario, deleteSessionScenario
} from "./sessionStorage";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // CPT Code Management
  cptCodes: router({
    list: guestOrAuthProcedure.query(async () => {
      return await db.getAllCptCodes();
    }),
    
    getById: guestOrAuthProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCptCodeById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string().max(10),
        description: z.string(),
        workRvu: z.number().optional(),
        procedureType: z.enum(["imaging", "procedure", "visit"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { workRvu, ...rest } = input;
        return await db.createCptCode({
          ...rest,
          workRvu: workRvu !== undefined ? workRvu.toString() : undefined,
        });
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().max(10).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCptCode(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCptCode(input.id);
        return { success: true };
      }),
  }),

  // Payer Management
  payers: router({
    list: guestOrAuthProcedure.query(async () => {
      return await db.getAllPayers();
    }),
    
    getById: guestOrAuthProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPayerById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        payerType: z.enum(["Medicare", "Medicaid", "Commercial"]),
        payerName: z.string().max(100),
      }))
      .mutation(async ({ input }) => {
        return await db.createPayer(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        payerType: z.enum(["Medicare", "Medicaid", "Commercial"]).optional(),
        payerName: z.string().max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePayer(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePayer(input.id);
        return { success: true };
      }),
  }),

  // Plan Management
  plans: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllPlans();
    }),
    
    listByPayer: protectedProcedure
      .input(z.object({ payerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlansByPayerId(input.payerId);
      }),
    
    create: adminProcedure
      .input(z.object({
        payerId: z.number(),
        planName: z.string().max(200),
      }))
      .mutation(async ({ input }) => {
        return await db.createPlan(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        payerId: z.number().optional(),
        planName: z.string().max(200).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePlan(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePlan(input.id);
        return { success: true };
      }),
  }),

  // Rate Management
  rates: router({
    list: guestOrAuthProcedure.query(async () => {
      return await db.getAllRates();
    }),
    
    listWithDetails: guestOrAuthProcedure.query(async ({ ctx }) => {
      const dbRates = await db.getRatesWithDetails();
      
      // For guests, use guest session ID
      if (ctx.isGuest && ctx.guestSessionId) {
        const sessionRates = getAllSessionRates(ctx.guestSessionId);
        const sessionRateMap = new Map(sessionRates.map(r => [r.id, r]));
        
        return dbRates.map(rate => {
          const sessionRate = sessionRateMap.get(rate.id);
          return sessionRate || rate;
        });
      }
      
      // For non-admin authenticated users, merge with session data
      if (ctx.user && ctx.user.role !== 'admin') {
        const sessionId = getSessionId(ctx.user.id, undefined);
        if (sessionId) {
          const sessionRates = getAllSessionRates(sessionId);
          const sessionRateMap = new Map(sessionRates.map(r => [r.id, r]));
          
          return dbRates.map(rate => {
            const sessionRate = sessionRateMap.get(rate.id);
            return sessionRate || rate;
          });
        }
      }
      
      return dbRates;
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getRateById(input.id);
      }),
    
    getByCptCode: protectedProcedure
      .input(z.object({ cptCodeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRatesByCptCode(input.cptCodeId);
      }),
    
    create: adminProcedure
      .input(z.object({
        cptCodeId: z.number(),
        payerType: z.enum(["Medicare", "Commercial", "Medicaid"]),
        siteType: z.enum(["FPA", "Article28"]),
        component: z.enum(["Professional", "Technical", "Global"]),
        rate: z.number(),
        verified: z.boolean().default(false),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createRate(input);
      }),
    
    update: guestOrAuthProcedure
      .input(z.object({
        id: z.number(),
        cptCodeId: z.number().optional(),
        payerType: z.enum(["Medicare", "Commercial", "Medicaid"]).optional(),
        siteType: z.enum(["FPA", "Article28"]).optional(),
        component: z.enum(["Professional", "Technical", "Global"]).optional(),
        rate: z.number().optional(),
        verified: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Admin edits persist to database
        if (ctx.user && ctx.user.role === 'admin') {
          await db.updateRate(id, data);
        } else {
          // Guest and user edits are session-only
          const sessionId = ctx.isGuest && ctx.guestSessionId 
            ? ctx.guestSessionId 
            : ctx.user ? getSessionId(ctx.user.id, undefined) : null;
            
          if (sessionId) {
            // Get the current rate with joined fields and merge with updates
            const allRates = await db.getRatesWithDetails();
            const currentRate = allRates.find(r => r.id === id);
            if (currentRate) {
              const updatedRate = { ...currentRate, ...data };
              updateSessionRate(sessionId, id, updatedRate);
            }
          }
        }
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRate(input.id);
        return { success: true };
      }),
    
    bulkImport: adminProcedure
      .input(z.object({
        rates: z.array(z.object({
          cptCode: z.string(),
          payerType: z.enum(["Medicare", "Commercial", "Medicaid"]),
          siteType: z.enum(["FPA", "Article28"]),
          component: z.enum(["Professional", "Technical", "Global"]),
          rate: z.number(),
          verified: z.boolean().default(false),
          notes: z.string().optional(),
        }))
      }))
      .mutation(async ({ input }) => {
        const allCptCodes = await db.getAllCptCodes();
        const cptCodeMap = new Map(allCptCodes.map(cpt => [cpt.code, cpt.id]));
        
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
        
        for (const rateData of input.rates) {
          try {
            const cptCodeId = cptCodeMap.get(rateData.cptCode);
            if (!cptCodeId) {
              errors.push(`CPT code ${rateData.cptCode} not found`);
              errorCount++;
              continue;
            }
            
            // Check if rate already exists
            const existingRates = await db.getRatesByCptCode(cptCodeId);
            const existingRate = existingRates.find(
              r => r.siteType === rateData.siteType && 
                   r.component === rateData.component && 
                   r.payerType === rateData.payerType
            );
            
            if (existingRate) {
              // Update existing rate
              await db.updateRate(existingRate.id, {
                rate: rateData.rate,
                verified: rateData.verified,
                notes: rateData.notes,
              });
            } else {
              // Create new rate
              await db.createRate({
                cptCodeId,
                payerType: rateData.payerType,
                siteType: rateData.siteType,
                component: rateData.component,
                rate: rateData.rate,
                verified: rateData.verified,
                notes: rateData.notes,
              });
            }
            successCount++;
          } catch (error) {
            errorCount++;
            errors.push(`Error processing ${rateData.cptCode}: ${error}`);
          }
        }
        
        return {
          success: errorCount === 0,
          successCount,
          errorCount,
          errors,
        };
      }),
  }),

  // Payer Multiplier Management
  multipliers: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllMultipliers();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMultiplierById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        payerId: z.number().optional(),
        payerType: z.enum(["Medicare", "Medicaid", "Commercial"]).optional(),
        professionalMultiplier: z.number(),
        technicalMultiplier: z.number(),
        globalMultiplier: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createMultiplier(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        payerId: z.number().optional(),
        payerType: z.enum(["Medicare", "Medicaid", "Commercial"]).optional(),
        professionalMultiplier: z.number().optional(),
        technicalMultiplier: z.number().optional(),
        globalMultiplier: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMultiplier(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMultiplier(input.id);
        return { success: true };
      }),
  }),

  // Scenario Management
  scenarios: router({
    list: guestOrAuthProcedure.query(async ({ ctx }) => {
      // Guests get scenarios from session storage
      if (ctx.isGuest && ctx.guestSessionId) {
        return getAllSessionScenarios(ctx.guestSessionId);
      }
      // Authenticated users get from database
      if (ctx.user) {
        const dbScenarios = await db.getAllScenarios(ctx.user.id);
        // For non-admin users, merge with session scenarios
        if (ctx.user.role !== 'admin') {
          const sessionId = getSessionId(ctx.user.id, undefined);
          if (sessionId) {
            const sessionScenarios = getAllSessionScenarios(sessionId);
            return [...dbScenarios, ...sessionScenarios];
          }
        }
        return dbScenarios;
      }
      return [];
    }),
    
    getById: guestOrAuthProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // Check session storage first
        const sessionId = ctx.isGuest && ctx.guestSessionId 
          ? ctx.guestSessionId 
          : ctx.user ? getSessionId(ctx.user.id, undefined) : null;
        
        if (sessionId) {
          const sessionScenario = getSessionScenario(sessionId, input.id);
          if (sessionScenario) return sessionScenario;
        }
        
        // Fall back to database
        return await db.getScenarioById(input.id);
      }),
    
    getWithDetails: guestOrAuthProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        // Check session storage first
        const sessionId = ctx.isGuest && ctx.guestSessionId 
          ? ctx.guestSessionId 
          : ctx.user ? getSessionId(ctx.user.id, undefined) : null;
        
        if (sessionId) {
          const sessionScenario = getSessionScenario(sessionId, input.id);
          if (sessionScenario) return sessionScenario;
        }
        
        // Fall back to database
        return await db.getScenarioWithDetails(input.id);
      }),
    
    create: guestOrAuthProcedure
      .input(z.object({
        providerName: z.string().max(200),
        totalPatients: z.number(),
        medicarePercent: z.number().min(0).max(100),
        commercialPercent: z.number().min(0).max(100),
        medicaidPercent: z.number().min(0).max(100),
        siteType: z.enum(["FPA", "Article28"]),
        rateMode: z.enum(["manual", "calculated"]).default("manual"),
        procedures: z.array(z.object({
          cptCodeId: z.number(),
          quantity: z.number(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { procedures, ...scenarioData } = input;
        
        // Guests store in session
        if (ctx.isGuest && ctx.guestSessionId) {
          const scenarioId = createSessionScenario(ctx.guestSessionId, {
            ...scenarioData,
            procedures,
            fpaTotal: null,
            article28Total: null,
          });
          return { id: scenarioId, success: true };
        }
        
        // Authenticated users store in database
        if (ctx.user) {
          // Non-admin users store in session
          if (ctx.user.role !== 'admin') {
            const sessionId = getSessionId(ctx.user.id, undefined);
            if (sessionId) {
              const scenarioId = createSessionScenario(sessionId, {
                ...scenarioData,
                procedures,
                fpaTotal: null,
                article28Total: null,
              });
              return { id: scenarioId, success: true };
            }
          }
          
          // Admin users store in database
          const result = await db.createScenario({
            ...scenarioData,
            userId: ctx.user.id,
            fpaTotal: null,
            article28Total: null,
          });
          
          const scenarioId = result.insertId;
          
          if (!scenarioId) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create scenario' });
          }
          
          // Create scenario details
          for (const proc of procedures) {
            await db.createScenarioDetail({
              scenarioId,
              cptCodeId: proc.cptCodeId,
              quantity: proc.quantity,
            });
          }
          
          return { id: scenarioId, success: true };
        }
        
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }),
    
    delete: guestOrAuthProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Check session storage first
        const sessionId = ctx.isGuest && ctx.guestSessionId 
          ? ctx.guestSessionId 
          : ctx.user ? getSessionId(ctx.user.id, undefined) : null;
        
        if (sessionId) {
          const sessionScenario = getSessionScenario(sessionId, input.id);
          if (sessionScenario) {
            deleteSessionScenario(sessionId, input.id);
            return { success: true };
          }
        }
        
        // Fall back to database (admin only)
        if (ctx.user) {
          const scenario = await db.getScenarioById(input.id);
          if (!scenario || scenario.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN' });
          }
          
          await db.deleteScenarioDetails(input.id);
          await db.deleteScenario(input.id);
          return { success: true };
        }
        
        throw new TRPCError({ code: 'NOT_FOUND' });
      }),
    
    // Calculate reimbursement for a scenario
    calculate: guestOrAuthProcedure
      .input(z.object({
        scenarioId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get scenario from session or database
        const sessionId = ctx.isGuest && ctx.guestSessionId 
          ? ctx.guestSessionId 
          : ctx.user ? getSessionId(ctx.user.id, undefined) : null;
        
        let scenario;
        if (sessionId) {
          scenario = getSessionScenario(sessionId, input.scenarioId);
        }
        
        if (!scenario && ctx.user) {
          scenario = await db.getScenarioWithDetails(input.scenarioId);
          if (!scenario || scenario.userId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN' });
          }
        }
        
        if (!scenario) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        // Get calculation settings for calculated rate mode
        const calcSettings = await db.getCalculationSettings();
        const commercialMultiplier = calcSettings ? calcSettings.commercialTechnicalMultiplier / 100 : 1.5;
        const medicaidMultiplier = calcSettings ? calcSettings.medicaidTechnicalMultiplier / 100 : 0.8;
        
        // Get all rates from database
        const dbRates = await db.getAllRates();
        
        // For guests and non-admin users, merge with session rates
        let allRates: any[] = dbRates;
        if (sessionId) {
          const sessionRates = getAllSessionRates(sessionId);
          const sessionRateMap = new Map(sessionRates.map(r => [r.id, r]));
          allRates = dbRates.map(rate => sessionRateMap.get(rate.id) || rate);
        }
        
        // Convert procedures to details format for session scenarios
        const sessionScenario = scenario as any;
        const details = sessionScenario.details || sessionScenario.procedures?.map((p: any) => ({
          id: 0,
          cptCodeId: p.cptCodeId,
          cptCode: null,
          cptDescription: null,
          quantity: p.quantity
        })) || [];
        
        let fpaTotal = 0;
        let article28Total = 0;
        let article28Professional = 0;
        let article28Technical = 0;
        const cptBreakdown: Array<{
          cptCode: string;
          cptDescription: string;
          quantity: number;
          fpaRevenue: number;
          article28Revenue: number;
          article28Prof: number;
          article28Tech: number;
        }> = [];
        
        // Calculate for each procedure
        for (const detail of details) {
          if (!detail.cptCodeId) continue;
          
          // Find applicable rates by payer type
          const fpaRates = allRates.filter(r => 
            r.cptCodeId === detail.cptCodeId && r.siteType === 'FPA' && r.component === 'Global'
          );
          const article28ProfRates = allRates.filter(r => 
            r.cptCodeId === detail.cptCodeId && r.siteType === 'Article28' && r.component === 'Professional'
          );
          const article28TechRates = allRates.filter(r => 
            r.cptCodeId === detail.cptCodeId && r.siteType === 'Article28' && r.component === 'Technical'
          );
          
          // Get rates for each payer type
          const fpaGlobalMedicare = fpaRates.find(r => r.payerType === 'Medicare');
          const fpaGlobalCommercial = fpaRates.find(r => r.payerType === 'Commercial');
          const fpaGlobalMedicaid = fpaRates.find(r => r.payerType === 'Medicaid');
          
          const article28ProfMedicare = article28ProfRates.find(r => r.payerType === 'Medicare');
          const article28ProfCommercial = article28ProfRates.find(r => r.payerType === 'Commercial');
          const article28ProfMedicaid = article28ProfRates.find(r => r.payerType === 'Medicaid');
          
          const article28TechMedicare = article28TechRates.find(r => r.payerType === 'Medicare');
          const article28TechCommercial = article28TechRates.find(r => r.payerType === 'Commercial');
          const article28TechMedicaid = article28TechRates.find(r => r.payerType === 'Medicaid');
          
          // Skip if any required rates are missing
          if (!fpaGlobalMedicare || !fpaGlobalCommercial || !fpaGlobalMedicaid ||
              !article28ProfMedicare || !article28ProfCommercial || !article28ProfMedicaid ||
              !article28TechMedicare || !article28TechCommercial || !article28TechMedicaid) {
            continue;
          }
          
          // Calculate weighted average based on payer mix (no multipliers, direct rates)
          const medicarePercent = scenario.medicarePercent / 100;
          const commercialPercent = scenario.commercialPercent / 100;
          const medicaidPercent = scenario.medicaidPercent / 100;
          
          // FPA calculation (weighted average of direct rates)
          const fpaWeightedRate = 
            (fpaGlobalMedicare.rate * medicarePercent) +
            (fpaGlobalCommercial.rate * commercialPercent) +
            (fpaGlobalMedicaid.rate * medicaidPercent);
          
          // Article 28 Professional calculation
          const article28ProfWeightedRate = 
            (article28ProfMedicare.rate * medicarePercent) +
            (article28ProfCommercial.rate * commercialPercent) +
            (article28ProfMedicaid.rate * medicaidPercent);
          
          // Article 28 Technical calculation
          let article28TechWeightedRate;
          if (scenario.rateMode === 'calculated') {
            // Calculated mode: apply multipliers to Medicare Technical rate
            const medicareTechRate = article28TechMedicare.rate;
            const commercialTechRate = medicareTechRate * commercialMultiplier;
            const medicaidTechRate = medicareTechRate * medicaidMultiplier;
            
            article28TechWeightedRate = 
              (medicareTechRate * medicarePercent) +
              (commercialTechRate * commercialPercent) +
              (medicaidTechRate * medicaidPercent);
          } else {
            // Manual mode: use entered rates
            article28TechWeightedRate = 
              (article28TechMedicare.rate * medicarePercent) +
              (article28TechCommercial.rate * commercialPercent) +
              (article28TechMedicaid.rate * medicaidPercent);
          }
          
          const article28WeightedRate = article28ProfWeightedRate + article28TechWeightedRate;
          
          const fpaRevenue = fpaWeightedRate * detail.quantity;
          const article28ProfRevenue = article28ProfWeightedRate * detail.quantity;
          const article28TechRevenue = article28TechWeightedRate * detail.quantity;
          const article28Revenue = article28WeightedRate * detail.quantity;
          
          article28Professional += article28ProfRevenue;
          article28Technical += article28TechRevenue;
          article28Total += article28Revenue;
          fpaTotal += fpaRevenue;
          
          cptBreakdown.push({
            cptCode: detail.cptCode || '',
            cptDescription: detail.cptDescription || '',
            quantity: detail.quantity,
            fpaRevenue,
            article28Revenue,
            article28Prof: article28ProfRevenue,
            article28Tech: article28TechRevenue,
          });
        }
        
        // Update scenario with calculated totals
        await db.updateScenario(input.scenarioId, {
          fpaTotal,
          article28Total,
        });
        
        return {
          fpaTotal,
          article28Total,
          article28Professional,
          article28Technical,
          difference: article28Total - fpaTotal,
          percentDifference: fpaTotal > 0 ? ((article28Total - fpaTotal) / fpaTotal) * 100 : 0,
          cptBreakdown,
        };
      }),
  }),

  // Admin Management
  admin: router({
    listUsers: protectedProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    setRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["admin", "user"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    
    // Calculation Settings
    getCalculationSettings: adminProcedure.query(async () => {
      const settings = await db.getCalculationSettings();
      if (!settings) {
        // Initialize with defaults if not exists
        await db.initializeCalculationSettings();
        return await db.getCalculationSettings();
      }
      return settings;
    }),
    
    updateCalculationSettings: adminProcedure
      .input(z.object({
        commercialTechnicalMultiplier: z.number().min(50).max(300), // 0.5x to 3.0x
        medicaidTechnicalMultiplier: z.number().min(50).max(300),
      }))
      .mutation(async ({ input }) => {
        await db.upsertCalculationSettings(input);
        return { success: true };
      }),
    
    // Institutions Management
    listInstitutions: adminProcedure.query(async () => {
      return await db.getAllInstitutions();
    }),
    
    listActiveInstitutions: guestOrAuthProcedure.query(async () => {
      return await db.getActiveInstitutions();
    }),
    
    getInstitution: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInstitutionById(input.id);
      }),
    
    createInstitution: adminProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
        shortName: z.string().max(50).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createInstitution(input);
      }),
    
    updateInstitution: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        shortName: z.string().max(50).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return await db.updateInstitution(id, updates);
      }),
    
    deleteInstitution: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteInstitution(input.id);
        return { success };
      }),
    
    // Providers Management
    listProviders: adminProcedure.query(async () => {
      return await db.getAllProviders();
    }),
    
    listActiveProviders: guestOrAuthProcedure.query(async () => {
      return await db.getActiveProviders();
    }),
    
    getProvider: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProviderById(input.id);
      }),
    
    getProvidersByInstitution: adminProcedure
      .input(z.object({ institutionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProvidersByInstitution(input.institutionId);
      }),
    
    createProvider: adminProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
        providerType: z.enum(["Type1", "Type2", "Type3"]),
        homeInstitutionId: z.number(),
        active: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProvider(input);
      }),
    
    updateProvider: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        providerType: z.enum(["Type1", "Type2", "Type3"]).optional(),
        homeInstitutionId: z.number().optional(),
        active: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return await db.updateProvider(id, updates);
      }),
    
    deleteProvider: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await db.deleteProvider(input.id);
        return { success };
      }),
  }),

  // Valuation Management
  valuations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getValuationsWithSummary(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getValuationById(input.id);
      }),
    
    getWithDetails: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getValuationWithDetails(input.id);
      }),
    
    getActivities: protectedProcedure
      .input(z.object({ valuationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getValuationActivitiesByValuation(input.valuationId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        providerId: z.number(),
        name: z.string().max(200),
        description: z.string().optional(),
        monthlyPatients: z.number().default(0),
        activities: z.array(z.object({
          cptCodeId: z.number(),
          monthlyOrders: z.number().default(0),
          monthlyReads: z.number().default(0),
          monthlyPerforms: z.number().default(0),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { activities, ...valuationData } = input;
        
        // Create valuation
        const valuation = await db.createValuation({
          ...valuationData,
          userId: ctx.user.id,
        });
        
        if (!valuation) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create valuation' });
        }
        
        // Create activities
        for (const activity of activities) {
          await db.createValuationActivity({
            valuationId: valuation.id,
            ...activity,
          });
        }
        
        return { id: valuation.id, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().max(200).optional(),
        description: z.string().optional(),
        providerId: z.number().optional(),
        monthlyPatients: z.number().optional(),
        activities: z.array(z.object({
          cptCodeId: z.number(),
          monthlyOrders: z.number().default(0),
          monthlyReads: z.number().default(0),
          monthlyPerforms: z.number().default(0),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, activities, ...data } = input;
        
        // Update valuation basic info
        await db.updateValuation(id, data);
        
        // If activities provided, replace all activities
        if (activities) {
          // Delete existing activities
          const existingActivities = await db.getValuationActivitiesByValuation(id);
          for (const activity of existingActivities) {
            await db.deleteValuationActivity(activity.id);
          }
          
          // Create new activities
          for (const activity of activities) {
            await db.createValuationActivity({
              valuationId: id,
              ...activity,
            });
          }
        }
        
        return { id, success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteValuation(input.id);
        return { success: true };
      }),
    
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const newValuation = await db.duplicateValuation(input.id, ctx.user.id);
        return newValuation;
      }),
    
    bulkUpdate: protectedProcedure
      .input(z.object({
        valuationIds: z.array(z.number()),
        activities: z.array(z.object({
          cptCodeId: z.number(),
          monthlyOrders: z.number().default(0),
          monthlyReads: z.number().default(0),
          monthlyPerforms: z.number().default(0),
        })),
      }))
      .mutation(async ({ input }) => {
        const { valuationIds, activities } = input;
        
        // Update each valuation with the same activities
        for (const valuationId of valuationIds) {
          // Delete existing activities
          const existingActivities = await db.getValuationActivitiesByValuation(valuationId);
          for (const activity of existingActivities) {
            await db.deleteValuationActivity(activity.id);
          }
          
          // Create new activities
          for (const activity of activities) {
            await db.createValuationActivity({
              valuationId,
              ...activity,
            });
          }
        }
        
        return { success: true, updatedCount: valuationIds.length };
      }),
    
    calculate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const valuation = await db.getValuationWithDetails(input.id);
        if (!valuation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Valuation not found' });
        }
        
        const provider = await db.getProviderById(valuation.providerId);
        if (!provider) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Provider not found' });
        }
        
        const institution = provider.homeInstitutionId 
          ? await db.getInstitutionById(provider.homeInstitutionId)
          : null;
        
        // Get all CPT codes and rates
        const allCptCodes = await db.getAllCptCodes();
        const allRates = await db.getRatesWithDetails();
        
        // Calculate RVUs and revenue for each activity
        const activityResults = [];
        let totalRvus = 0;
        let totalProfessionalRevenue = 0;
        let totalTechnicalRevenue = 0;
        
        for (const activity of valuation.activities) {
          const cptCode = allCptCodes.find(c => c.id === activity.cptCodeId);
          if (!cptCode) continue;
          
          const workRvu = cptCode.workRvu ? parseFloat(cptCode.workRvu) : 0;
          const isImaging = cptCode.procedureType === 'imaging';
          
          // Calculate RVUs
          let activityRvus = 0;
          if (isImaging) {
            // For imaging: RVUs only from reads
            activityRvus = (activity.monthlyReads || 0) * workRvu;
          } else {
            // For procedures/visits: RVUs from performs
            activityRvus = (activity.monthlyPerforms || 0) * workRvu;
          }
          totalRvus += activityRvus;
          
          // Calculate revenue
          // Get Article 28 rates (assuming provider works at Article 28 facility)
          const professionalRate = allRates.find(
            r => r.cptCodeId === cptCode.id && 
                 r.siteType === 'Article28' && 
                 r.component === 'Professional' &&
                 r.payerType === 'Medicare' // Use Medicare as base
          );
          
          const technicalRate = allRates.find(
            r => r.cptCodeId === cptCode.id && 
                 r.siteType === 'Article28' && 
                 r.component === 'Technical' &&
                 r.payerType === 'Medicare'
          );
          
          let activityProfessionalRevenue = 0;
          let activityTechnicalRevenue = 0;
          
          if (isImaging) {
            // Professional revenue from reads
            if (professionalRate) {
              activityProfessionalRevenue = (activity.monthlyReads || 0) * professionalRate.rate;
            }
            // Technical revenue from orders (someone has to read them)
            if (technicalRate) {
              activityTechnicalRevenue = (activity.monthlyOrders || 0) * technicalRate.rate;
            }
          } else {
            // Professional revenue from performs
            if (professionalRate) {
              activityProfessionalRevenue = (activity.monthlyPerforms || 0) * professionalRate.rate;
            }
            // No technical revenue for non-imaging procedures
          }
          
          totalProfessionalRevenue += activityProfessionalRevenue;
          totalTechnicalRevenue += activityTechnicalRevenue;
          
          activityResults.push({
            cptCode: cptCode.code,
            description: cptCode.description,
            procedureType: cptCode.procedureType,
            workRvu,
            monthlyOrders: activity.monthlyOrders,
            monthlyReads: activity.monthlyReads,
            monthlyPerforms: activity.monthlyPerforms,
            rvusEarned: activityRvus,
            professionalRevenue: activityProfessionalRevenue,
            technicalRevenue: activityTechnicalRevenue,
          });
        }
        
        // Determine revenue attribution based on provider type
        let professionalRevenueDestination = '';
        let professionalRevenueRecipient = '';
        
        if (provider.providerType === 'Type1') {
          professionalRevenueDestination = 'Mount Sinai West Article 28';
          professionalRevenueRecipient = provider.name;
        } else if (provider.providerType === 'Type2') {
          professionalRevenueDestination = institution?.name || 'Home Institution';
          professionalRevenueRecipient = institution?.name || 'Home Institution';
        } else if (provider.providerType === 'Type3') {
          professionalRevenueDestination = 'Reading Physician';
          professionalRevenueRecipient = 'Other Providers';
          totalRvus = 0; // Type 3 providers don't earn RVUs
        }
        
        return {
          valuation,
          provider,
          institution,
          activityResults,
          summary: {
            totalRvus,
            totalProfessionalRevenue,
            totalTechnicalRevenue,
            professionalRevenueDestination,
            professionalRevenueRecipient,
            technicalRevenueDestination: 'Mount Sinai West Article 28',
          },
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
