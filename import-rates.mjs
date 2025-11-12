import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { cptCodes, rates } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

async function importRates() {
  console.log('Reading CSV file...');
  const csvContent = readFileSync('./updated-rates.csv', 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  console.log(`Found ${dataLines.length} rates to import`);
  
  // Get all CPT codes
  const allCptCodes = await db.select().from(cptCodes);
  const cptCodeMap = new Map(allCptCodes.map(cpt => [cpt.code, cpt.id]));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const line of dataLines) {
    const [cptCode, siteType, component, rateStr, verifiedStr, notes] = line.split(',').map(v => v.trim());
    
    try {
      const cptCodeId = cptCodeMap.get(cptCode);
      if (!cptCodeId) {
        console.log(`CPT code ${cptCode} not found, skipping`);
        errorCount++;
        continue;
      }
      
      const rateCents = Math.round(parseFloat(rateStr) * 100);
      const verified = verifiedStr.toLowerCase() === 'true';
      
      // Check if rate exists
      const existingRates = await db
        .select()
        .from(rates)
        .where(
          and(
            eq(rates.cptCodeId, cptCodeId),
            eq(rates.siteType, siteType),
            eq(rates.component, component)
          )
        );
      
      if (existingRates.length > 0) {
        // Update existing
        await db
          .update(rates)
          .set({ rate: rateCents, verified, notes })
          .where(eq(rates.id, existingRates[0].id));
        console.log(`Updated ${cptCode} ${siteType} ${component}`);
      } else {
        // Insert new
        await db.insert(rates).values({
          cptCodeId,
          siteType,
          component,
          rate: rateCents,
          verified,
          notes,
        });
        console.log(`Created ${cptCode} ${siteType} ${component}`);
      }
      
      successCount++;
    } catch (error) {
      console.error(`Error processing ${cptCode}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\nImport complete:`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

importRates().catch(console.error);
