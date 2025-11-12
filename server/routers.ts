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
        payerId: z.number().optional(),
        planId: z.number().optional(),
        siteType: z.enum(["FPA", "Article28"]),
        component: z.enum(["Professional", "Technical", "Global"]),
        rate: z.number(),
        verified: z.boolean().default(false),
        medicareBase: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createRate(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        cptCodeId: z.number().optional(),
        payerId: z.number().optional(),
        planId: z.number().optional(),
        siteType: z.enum(["FPA", "Article28"]).optional(),
        component: z.enum(["Professional", "Technical", "Global"]).optional(),
        rate: z.number().optional(),
        verified: z.boolean().optional(),
        medicareBase: z.number().optional(),
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
        
        // Get all rates and multipliers
        const allRates = await db.getAllRates();
        const allMultipliers = await db.getAllMultipliers();
        
        // Get multipliers by payer type
        const medicareMultiplier = allMultipliers.find(m => m.payerType === 'Medicare');
        const commercialMultiplier = allMultipliers.find(m => m.payerType === 'Commercial');
        const medicaidMultiplier = allMultipliers.find(m => m.payerType === 'Medicaid');
        
        let fpaTotal = 0;
        let article28Total = 0;
        
        // Calculate for each procedure
        for (const detail of scenario.details) {
          if (!detail.cptCodeId) continue;
          
          // Find applicable rates (these are Medicare base rates)
          const fpaRates = allRates.filter(r => 
            r.cptCodeId === detail.cptCodeId && r.siteType === 'FPA'
          );
          const article28Rates = allRates.filter(r => 
            r.cptCodeId === detail.cptCodeId && r.siteType === 'Article28'
          );
          
          // Get base rates
          const fpaGlobalRate = fpaRates.find(r => r.component === 'Global');
          const article28ProfRate = article28Rates.find(r => r.component === 'Professional');
          const article28TechRate = article28Rates.find(r => r.component === 'Technical');
          
          if (!fpaGlobalRate || !article28ProfRate || !article28TechRate) continue;
          
          // Calculate weighted average based on payer mix
          const medicarePercent = scenario.medicarePercent / 100;
          const commercialPercent = scenario.commercialPercent / 100;
          const medicaidPercent = scenario.medicaidPercent / 100;
          
          // FPA calculation (uses Global rate with multipliers)
          const fpaGlobalBase = fpaGlobalRate.rate;
          const fpaMedicare = fpaGlobalBase * medicarePercent * (medicareMultiplier?.globalMultiplier || 100) / 100;
          const fpaCommercial = fpaGlobalBase * commercialPercent * (commercialMultiplier?.globalMultiplier || 165) / 100;
          const fpaMedicaid = fpaGlobalBase * medicaidPercent * (medicaidMultiplier?.globalMultiplier || 80) / 100;
          const fpaWeightedRate = fpaMedicare + fpaCommercial + fpaMedicaid;
          fpaTotal += fpaWeightedRate * detail.quantity;
          
          // Article 28 calculation (uses Professional + Technical with separate multipliers)
          const article28ProfBase = article28ProfRate.rate;
          const article28TechBase = article28TechRate.rate;
          
          // Professional component
          const profMedicare = article28ProfBase * medicarePercent * (medicareMultiplier?.professionalMultiplier || 100) / 100;
          const profCommercial = article28ProfBase * commercialPercent * (commercialMultiplier?.professionalMultiplier || 140) / 100;
          const profMedicaid = article28ProfBase * medicaidPercent * (medicaidMultiplier?.professionalMultiplier || 80) / 100;
          
          // Technical component
          const techMedicare = article28TechBase * medicarePercent * (medicareMultiplier?.technicalMultiplier || 100) / 100;
          const techCommercial = article28TechBase * commercialPercent * (commercialMultiplier?.technicalMultiplier || 220) / 100;
          const techMedicaid = article28TechBase * medicaidPercent * (medicaidMultiplier?.technicalMultiplier || 80) / 100;
          
          const article28WeightedRate = profMedicare + profCommercial + profMedicaid + techMedicare + techCommercial + techMedicaid;
          article28Total += article28WeightedRate * detail.quantity;
        }
        
        // Update scenario with calculated totals
        await db.updateScenario(input.scenarioId, {
          fpaTotal,
          article28Total,
        });
        
        return {
          fpaTotal,
          article28Total,
          difference: article28Total - fpaTotal,
          percentDifference: fpaTotal > 0 ? ((article28Total - fpaTotal) / fpaTotal) * 100 : 0,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
