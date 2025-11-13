import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
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
    list: protectedProcedure.query(async () => {
      return await db.getAllCptCodes();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCptCodeById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string().max(10),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCptCode(input);
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
    list: protectedProcedure.query(async () => {
      return await db.getAllPayers();
    }),
    
    getById: protectedProcedure
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
    list: protectedProcedure.query(async () => {
      return await db.getAllRates();
    }),
    
    listWithDetails: protectedProcedure.query(async () => {
      return await db.getRatesWithDetails();
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
    
    update: adminProcedure
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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateRate(id, data);
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
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllScenarios(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getScenarioById(input.id);
      }),
    
    getWithDetails: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getScenarioWithDetails(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        providerName: z.string().max(200),
        totalPatients: z.number(),
        medicarePercent: z.number().min(0).max(100),
        commercialPercent: z.number().min(0).max(100),
        medicaidPercent: z.number().min(0).max(100),
        siteType: z.enum(["FPA", "Article28"]),
        procedures: z.array(z.object({
          cptCodeId: z.number(),
          quantity: z.number(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { procedures, ...scenarioData } = input;
        
        // Create scenario
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
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const scenario = await db.getScenarioById(input.id);
        if (!scenario || scenario.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        await db.deleteScenarioDetails(input.id);
        await db.deleteScenario(input.id);
        return { success: true };
      }),
    
    // Calculate reimbursement for a scenario
    calculate: protectedProcedure
      .input(z.object({
        scenarioId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const scenario = await db.getScenarioWithDetails(input.scenarioId);
        
        if (!scenario || scenario.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        // Get all rates (now includes payerType directly)
        const allRates = await db.getAllRates();
        
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
        for (const detail of scenario.details) {
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
          const article28TechWeightedRate = 
            (article28TechMedicare.rate * medicarePercent) +
            (article28TechCommercial.rate * commercialPercent) +
            (article28TechMedicaid.rate * medicaidPercent);
          
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
});

export type AppRouter = typeof appRouter;
