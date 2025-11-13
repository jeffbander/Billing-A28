import { drizzle } from "drizzle-orm/mysql2";
import { rates, payerMultipliers } from "./drizzle/schema.ts";
import { eq, and } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function migrateRates() {
  console.log("Starting rate migration...");
  
  // Get all existing rates (these are currently Medicare base rates without payerType)
  const existingRates = await db.select().from(rates);
  console.log(`Found ${existingRates.length} existing rates`);
  
  // Get multipliers for each payer type
  const multipliers = await db.select().from(payerMultipliers);
  console.log(`Found ${multipliers.length} multiplier records`);
  
  const medicareMultiplier = multipliers.find(m => m.payerType === 'Medicare');
  const commercialMultiplier = multipliers.find(m => m.payerType === 'Commercial');
  const medicaidMultiplier = multipliers.find(m => m.payerType === 'Medicaid');
  
  if (!medicareMultiplier || !commercialMultiplier || !medicaidMultiplier) {
    console.error("Missing multiplier records!");
    return;
  }
  
  // For each existing rate, create 3 new rates (one for each payer type)
  const newRates = [];
  
  for (const rate of existingRates) {
    // Skip if payerType is already set
    if (rate.payerType) {
      console.log(`Rate ${rate.id} already has payerType, skipping`);
      continue;
    }
    
    // Determine which multiplier to use based on component
    const getMultiplier = (payerType, component) => {
      const mult = payerType === 'Medicare' ? medicareMultiplier :
                   payerType === 'Commercial' ? commercialMultiplier :
                   medicaidMultiplier;
      
      if (component === 'Professional') return mult.professionalMultiplier;
      if (component === 'Technical') return mult.technicalMultiplier;
      return mult.globalMultiplier;
    };
    
    // Create Medicare rate (same as base)
    newRates.push({
      cptCodeId: rate.cptCodeId,
      payerType: 'Medicare',
      siteType: rate.siteType,
      component: rate.component,
      rate: rate.rate,
      verified: rate.verified,
      notes: rate.notes,
    });
    
    // Create Commercial rate (base * commercial multiplier)
    const commercialMult = getMultiplier('Commercial', rate.component);
    newRates.push({
      cptCodeId: rate.cptCodeId,
      payerType: 'Commercial',
      siteType: rate.siteType,
      component: rate.component,
      rate: Math.round(rate.rate * commercialMult / 100),
      verified: rate.verified,
      notes: rate.notes,
    });
    
    // Create Medicaid rate (base * medicaid multiplier)
    const medicaidMult = getMultiplier('Medicaid', rate.component);
    newRates.push({
      cptCodeId: rate.cptCodeId,
      payerType: 'Medicaid',
      siteType: rate.siteType,
      component: rate.component,
      rate: Math.round(rate.rate * medicaidMult / 100),
      verified: rate.verified,
      notes: rate.notes,
    });
  }
  
  console.log(`Generated ${newRates.length} new rates`);
  
  // Delete old rates without payerType
  console.log("Deleting old rates...");
  for (const rate of existingRates) {
    if (!rate.payerType) {
      await db.delete(rates).where(eq(rates.id, rate.id));
    }
  }
  
  // Insert new rates
  console.log("Inserting new rates...");
  if (newRates.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < newRates.length; i += 50) {
      const batch = newRates.slice(i, i + 50);
      await db.insert(rates).values(batch);
      console.log(`Inserted batch ${Math.floor(i/50) + 1}`);
    }
  }
  
  console.log("Migration complete!");
  console.log(`Total rates in database: ${(await db.select().from(rates)).length}`);
}

migrateRates().catch(console.error).finally(() => process.exit(0));
