import { drizzle } from 'drizzle-orm/mysql2';
import { rates, cptCodes } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

// Data from the user's image - all rates in dollars
const rateData = {
  '93306': {
    fpa: { medicare: 215, commercial: 486, medicaid: 214 },
    a28_prof: { medicare: 72, commercial: 120, medicaid: 53 },
    a28_tech: { medicare: 648, commercial: 991, medicaid: 592 }
  },
  '99213': {
    fpa: { medicare: 80, commercial: 134, medicaid: 98 },
    a28_prof: { medicare: 71, commercial: 93, medicaid: 57 },
    a28_tech: { medicare: 152, commercial: 312, medicaid: 166 }
  },
  '99214': {
    fpa: { medicare: 121, commercial: 181, medicaid: 58 },
    a28_prof: { medicare: 89, commercial: 133, medicaid: 87 },
    a28_tech: { medicare: 86, commercial: 330, medicaid: 163 }
  },
  '99203': {
    fpa: { medicare: 98, commercial: 158, medicaid: 97 },
    a28_prof: { medicare: 85, commercial: 138, medicaid: 77 },
    a28_tech: { medicare: null, commercial: 323, medicaid: 157 }
  },
  '99204': {
    fpa: { medicare: 152, commercial: 258, medicaid: 155 },
    a28_prof: { medicare: 189, commercial: 321, medicaid: 153 },
    a28_tech: { medicare: 109, commercial: 233, medicaid: 168 }
  },
  '99205': {
    fpa: { medicare: 209, commercial: 290, medicaid: 204 },
    a28_prof: { medicare: 181, commercial: 301, medicaid: 145 },
    a28_tech: { medicare: null, commercial: 320, medicaid: null }
  },
  '78452': {
    fpa: { medicare: 415, commercial: 666, medicaid: 186 },
    a28_prof: { medicare: 67, commercial: 98, medicaid: 67 },
    a28_tech: { medicare: 1474, commercial: 1933, medicaid: 1063 }
  },
  '93351': {
    fpa: { medicare: 262, commercial: 536, medicaid: null },
    a28_prof: { medicare: 81, commercial: 151, medicaid: 80 },
    a28_tech: { medicare: 580, commercial: 1772, medicaid: 492 }
  }
};

async function populateRates() {
  console.log('Starting to populate all rates...');
  
  // Get all CPT codes
  const allCptCodes = await db.select().from(cptCodes);
  console.log(`Found ${allCptCodes.length} CPT codes`);
  
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const cpt of allCptCodes) {
    const data = rateData[cpt.code];
    if (!data) {
      console.log(`No rate data for ${cpt.code}, skipping`);
      skipped++;
      continue;
    }
    
    // FPA Global rates
    for (const [payerType, rateValue] of Object.entries(data.fpa)) {
      if (rateValue === null) continue;
      
      const existing = await db.select().from(rates).where(
        eq(rates.cptCodeId, cpt.id)
      ).where(eq(rates.siteType, 'FPA'))
        .where(eq(rates.component, 'Global'))
        .where(eq(rates.payerType, payerType.charAt(0).toUpperCase() + payerType.slice(1)));
      
      const rateInCents = Math.round(rateValue * 100);
      
      if (existing.length > 0) {
        await db.update(rates).set({ rate: rateInCents }).where(eq(rates.id, existing[0].id));
        updated++;
      } else {
        await db.insert(rates).values({
          cptCodeId: cpt.id,
          siteType: 'FPA',
          component: 'Global',
          payerType: payerType.charAt(0).toUpperCase() + payerType.slice(1),
          rate: rateInCents,
          verified: true
        });
        inserted++;
      }
    }
    
    // Article 28 Professional rates
    for (const [payerType, rateValue] of Object.entries(data.a28_prof)) {
      if (rateValue === null) continue;
      
      const existing = await db.select().from(rates).where(
        eq(rates.cptCodeId, cpt.id)
      ).where(eq(rates.siteType, 'Article28'))
        .where(eq(rates.component, 'Professional'))
        .where(eq(rates.payerType, payerType.charAt(0).toUpperCase() + payerType.slice(1)));
      
      const rateInCents = Math.round(rateValue * 100);
      
      if (existing.length > 0) {
        await db.update(rates).set({ rate: rateInCents }).where(eq(rates.id, existing[0].id));
        updated++;
      } else {
        await db.insert(rates).values({
          cptCodeId: cpt.id,
          siteType: 'Article28',
          component: 'Professional',
          payerType: payerType.charAt(0).toUpperCase() + payerType.slice(1),
          rate: rateInCents,
          verified: true
        });
        inserted++;
      }
    }
    
    // Article 28 Technical rates
    for (const [payerType, rateValue] of Object.entries(data.a28_tech)) {
      if (rateValue === null) continue;
      
      const existing = await db.select().from(rates).where(
        eq(rates.cptCodeId, cpt.id)
      ).where(eq(rates.siteType, 'Article28'))
        .where(eq(rates.component, 'Technical'))
        .where(eq(rates.payerType, payerType.charAt(0).toUpperCase() + payerType.slice(1)));
      
      const rateInCents = Math.round(rateValue * 100);
      
      if (existing.length > 0) {
        await db.update(rates).set({ rate: rateInCents }).where(eq(rates.id, existing[0].id));
        updated++;
      } else {
        await db.insert(rates).values({
          cptCodeId: cpt.id,
          siteType: 'Article28',
          component: 'Technical',
          payerType: payerType.charAt(0).toUpperCase() + payerType.slice(1),
          rate: rateInCents,
          verified: true
        });
        inserted++;
      }
    }
    
    console.log(`Processed ${cpt.code}`);
  }
  
  console.log(`\nComplete! Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

populateRates().catch(console.error);
