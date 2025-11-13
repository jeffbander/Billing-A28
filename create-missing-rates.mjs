import { drizzle } from 'drizzle-orm/mysql2';
import { rates, cptCodes } from './drizzle/schema.ts';
import { and, eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

console.log('Creating placeholder rates for all missing combinations...');

// Get all CPT codes
const allCptCodes = await db.select().from(cptCodes);
console.log(`Found ${allCptCodes.length} CPT codes`);

const siteTypes = ['FPA', 'Article28'];
const components = {
  'FPA': ['Global'],
  'Article28': ['Professional', 'Technical']
};
const payerTypes = ['Medicare', 'Commercial', 'Medicaid'];

let created = 0;
let skipped = 0;

for (const cpt of allCptCodes) {
  for (const siteType of siteTypes) {
    const componentsForSite = components[siteType];
    
    for (const component of componentsForSite) {
      for (const payerType of payerTypes) {
        // Check if rate already exists
        const existing = await db.select()
          .from(rates)
          .where(
            and(
              eq(rates.cptCodeId, cpt.id),
              eq(rates.siteType, siteType),
              eq(rates.component, component),
              eq(rates.payerType, payerType)
            )
          )
          .limit(1);
        
        if (existing.length === 0) {
          // Create placeholder rate with $0.00
          await db.insert(rates).values({
            cptCodeId: cpt.id,
            siteType,
            component,
            payerType,
            rate: 0, // $0.00 in cents
            verified: false,
            notes: 'Placeholder - needs to be updated'
          });
          created++;
          console.log(`Created: ${cpt.code} - ${siteType} ${component} ${payerType}`);
        } else {
          skipped++;
        }
      }
    }
  }
}

console.log(`\nComplete! Created: ${created}, Skipped (already exists): ${skipped}`);
process.exit(0);
