import { drizzle } from "drizzle-orm/mysql2";
import { cptCodes, payers, payerMultipliers, rates } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("Seeding database...");

  // Seed CPT codes
  console.log("Seeding CPT codes...");
  const cptData = [
    { code: "99213", description: "Office visit, established patient, moderate complexity" },
    { code: "99214", description: "Office visit, established patient, high complexity" },
    { code: "93306", description: "Echocardiography, complete" },
    { code: "93351", description: "Echocardiography, stress test" },
    { code: "93000", description: "Electrocardiogram, complete" },
    { code: "76856", description: "Ultrasound, pelvic, complete" },
    { code: "80053", description: "Comprehensive metabolic panel" },
  ];

  for (const cpt of cptData) {
    await db.insert(cptCodes).values(cpt).onDuplicateKeyUpdate({ set: { description: cpt.description } });
  }

  // Seed payers
  console.log("Seeding payers...");
  const payerData = [
    { payerType: "Medicare", payerName: "Medicare" },
    { payerType: "Medicaid", payerName: "Medicaid" },
    { payerType: "Commercial", payerName: "BCBS" },
    { payerType: "Commercial", payerName: "Aetna" },
    { payerType: "Commercial", payerName: "UHC" },
    { payerType: "Commercial", payerName: "Cigna" },
  ];

  const payerIds = {};
  for (const payer of payerData) {
    await db.insert(payers).values(payer).onDuplicateKeyUpdate({ set: { payerType: payer.payerType } });
  }
  
  // Get payer IDs
  const allPayers = await db.select().from(payers);
  allPayers.forEach(payer => {
    payerIds[payer.payerName] = payer.id;
  });

  // Seed payer multipliers (based on PRD specifications)
  console.log("Seeding payer multipliers...");
  const multiplierData = [
    {
      payerType: "Medicare",
      professionalMultiplier: 100, // 1.00x stored as 100
      technicalMultiplier: 100,
      globalMultiplier: 100,
      notes: "Baseline reference",
    },
    {
      payerType: "Commercial",
      professionalMultiplier: 140, // 1.4x stored as 140
      technicalMultiplier: 220, // 2.2x stored as 220
      globalMultiplier: 165, // 1.65x stored as 165
      notes: "Based on Milliman/KFF 2025 averages",
    },
    {
      payerType: "Medicaid",
      professionalMultiplier: 80, // 0.8x stored as 80
      technicalMultiplier: 80,
      globalMultiplier: 80,
      notes: "Conservative baseline",
    },
    {
      payerId: payerIds["BCBS"],
      professionalMultiplier: 145,
      technicalMultiplier: 200,
      globalMultiplier: 165,
      notes: "Typical NY rates",
    },
    {
      payerId: payerIds["Aetna"],
      professionalMultiplier: 140,
      technicalMultiplier: 210,
      globalMultiplier: 165,
      notes: "Market estimate",
    },
    {
      payerId: payerIds["UHC"],
      professionalMultiplier: 150,
      technicalMultiplier: 220,
      globalMultiplier: 170,
      notes: "NYC range",
    },
    {
      payerId: payerIds["Cigna"],
      professionalMultiplier: 155,
      technicalMultiplier: 215,
      globalMultiplier: 170,
      notes: "Common PPO assumption",
    },
  ];

  for (const mult of multiplierData) {
    await db.insert(payerMultipliers).values(mult);
  }

  // Seed sample rates (Medicare baseline rates in cents)
  console.log("Seeding sample rates...");
  
  // Get CPT IDs
  const allCpts = await db.select().from(cptCodes);
  const cptMap = {};
  allCpts.forEach(cpt => {
    cptMap[cpt.code] = cpt.id;
  });

  // Sample Medicare rates (in cents)
  const sampleRates = [
    // 99213 - Office visit
    { cptCodeId: cptMap["99213"], siteType: "FPA", component: "Global", rate: 9300, verified: true, medicareBase: 9300, notes: "Medicare 2025 rate" },
    { cptCodeId: cptMap["99213"], siteType: "Article28", component: "Professional", rate: 5400, verified: true, medicareBase: 5400, notes: "Medicare 2025 rate" },
    { cptCodeId: cptMap["99213"], siteType: "Article28", component: "Technical", rate: 3900, verified: true, medicareBase: 3900, notes: "Medicare 2025 rate" },
    
    // 93306 - Echocardiography
    { cptCodeId: cptMap["93306"], siteType: "FPA", component: "Global", rate: 18500, verified: true, medicareBase: 18500, notes: "Medicare 2025 rate" },
    { cptCodeId: cptMap["93306"], siteType: "Article28", component: "Professional", rate: 7200, verified: true, medicareBase: 7200, notes: "Medicare 2025 rate" },
    { cptCodeId: cptMap["93306"], siteType: "Article28", component: "Technical", rate: 11300, verified: true, medicareBase: 11300, notes: "Medicare 2025 rate" },
    
    // 93000 - EKG
    { cptCodeId: cptMap["93000"], siteType: "FPA", component: "Global", rate: 1700, verified: true, medicareBase: 1700, notes: "Medicare 2025 rate" },
    { cptCodeId: cptMap["93000"], siteType: "Article28", component: "Professional", rate: 800, verified: true, medicareBase: 800, notes: "Medicare 2025 rate" },
    { cptCodeId: cptMap["93000"], siteType: "Article28", component: "Technical", rate: 900, verified: true, medicareBase: 900, notes: "Medicare 2025 rate" },
  ];

  for (const rate of sampleRates) {
    await db.insert(rates).values(rate);
  }

  console.log("Database seeded successfully!");
}

seed().catch(console.error);
