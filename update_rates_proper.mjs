import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq, and } from 'drizzle-orm';
import { rates, cptCodes } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Rate data from user's image
const rateData = [
  // CPT 93306
  { code: '93306', siteType: 'FPA', component: 'Global', payerType: 'Medicare', rate: 215 },
  { code: '93306', siteType: 'FPA', component: 'Global', payerType: 'Commercial', rate: 486 },
  { code: '93306', siteType: 'FPA', component: 'Global', payerType: 'Medicaid', rate: 214 },
  { code: '93306', siteType: 'Article28', component: 'Professional', payerType: 'Medicare', rate: 72 },
  { code: '93306', siteType: 'Article28', component: 'Professional', payerType: 'Commercial', rate: 120 },
  { code: '93306', siteType: 'Article28', component: 'Professional', payerType: 'Medicaid', rate: 53 },
  { code: '93306', siteType: 'Article28', component: 'Technical', payerType: 'Medicare', rate: 648 },
  { code: '93306', siteType: 'Article28', component: 'Technical', payerType: 'Commercial', rate: 991 },
  { code: '93306', siteType: 'Article28', component: 'Technical', payerType: 'Medicaid', rate: 592 },
  
  // CPT 99213
  { code: '99213', siteType: 'FPA', component: 'Global', payerType: 'Medicare', rate: 80 },
  { code: '99213', siteType: 'FPA', component: 'Global', payerType: 'Commercial', rate: 134 },
  { code: '99213', siteType: 'FPA', component: 'Global', payerType: 'Medicaid', rate: 98 },
  { code: '99213', siteType: 'Article28', component: 'Professional', payerType: 'Medicare', rate: 71 },
  { code: '99213', siteType: 'Article28', component: 'Professional', payerType: 'Commercial', rate: 93 },
  { code: '99213', siteType: 'Article28', component: 'Professional', payerType: 'Medicaid', rate: 57 },
  { code: '99213', siteType: 'Article28', component: 'Technical', payerType: 'Medicare', rate: 152 },
  { code: '99213', siteType: 'Article28', component: 'Technical', payerType: 'Commercial', rate: 312 },
  { code: '99213', siteType: 'Article28', component: 'Technical', payerType: 'Medicaid', rate: 166 },
  
  // CPT 99214
  { code: '99214', siteType: 'FPA', component: 'Global', payerType: 'Medicare', rate: 121 },
  { code: '99214', siteType: 'FPA', component: 'Global', payerType: 'Commercial', rate: 181 },
  { code: '99214', siteType: 'FPA', component: 'Global', payerType: 'Medicaid', rate: 0 },
  { code: '99214', siteType: 'Article28', component: 'Professional', payerType: 'Medicare', rate: 89 },
  { code: '99214', siteType: 'Article28', component: 'Professional', payerType: 'Commercial', rate: 133 },
  { code: '99214', siteType: 'Article28', component: 'Professional', payerType: 'Medicaid', rate: 87 },
  { code: '99214', siteType: 'Article28', component: 'Technical', payerType: 'Medicare', rate: 86 },
  { code: '99214', siteType: 'Article28', component: 'Technical', payerType: 'Commercial', rate: 330 },
  { code: '99214', siteType: 'Article28', component: 'Technical', payerType: 'Medicaid', rate: 163 },
  
  // CPT 99203
  { code: '99203', siteType: 'FPA', component: 'Global', payerType: 'Medicare', rate: 98 },
  { code: '99203', siteType: 'FPA', component: 'Global', payerType: 'Commercial', rate: 158 },
  { code: '99203', siteType: 'FPA', component: 'Global', payerType: 'Medicaid', rate: 97 },
  { code: '99203', siteType: 'Article28', component: 'Professional', payerType: 'Medicare', rate: 85 },
  { code: '99203', siteType: 'Article28', component: 'Professional', payerType: 'Commercial', rate: 138 },
  { code: '99203', siteType: 'Article28', component: 'Professional', payerType: 'Medicaid', rate: 77 },
  { code: '99203', siteType: 'Article28', component: 'Technical', payerType: 'Medicare', rate: 0 },
  { code: '99203', siteType: 'Article28', component: 'Technical', payerType: 'Commercial', rate: 323 },
  { code: '99203', siteType: 'Article28', component: 'Technical', payerType: 'Medicaid', rate: 157 },
  
  // CPT 99204
  { code: '99204', siteType: 'FPA', component: 'Global', payerType: 'Medicare', rate: 152 },
  { code: '99204', siteType: 'FPA', component: 'Global', payerType: 'Commercial', rate: 258 },
  { code: '99204', siteType: 'FPA', component: 'Global', payerType: 'Medicaid', rate: 155 },
  { code: '99204', siteType: 'Article28', component: 'Professional', payerType: 'Medicare', rate: 189 },
  { code: '99204', siteType: 'Article28', component: 'Professional', payerType: 'Commercial', rate: 321 },
  { code: '99204', siteType: 'Article28', component: 'Professional', payerType: 'Medicaid', rate: 153 },
  { code: '99204', siteType: 'Article28', component: 'Technical', payerType: 'Medicare', rate: 109 },
  { code: '99204', siteType: 'Article28', component: 'Technical', payerType: 'Commercial', rate: 233 },
  { code: '99204', siteType: 'Article28', component: 'Technical', payerType: 'Medicaid', rate: 168 },
  
  // CPT 99205
  { code: '99205', siteType: 'FPA', component: 'Global', payerType: 'Medicare', rate: 209 },
  { code: '99205', siteType: 'FPA', component: 'Global', payerType: 'Commercial', rate: 290 },
  { code: '99205', siteType: 'FPA', component: 'Global', payerType: 'Medicaid', rate: 204 },
  { code: '99205', siteType: 'Article28', component: 'Professional', payerType: 'Medicare', rate: 181 },
  { code: '99205', siteType: 'Article28', component: 'Professional', payerType: 'Commercial', rate: 301 },
  { code: '99205', siteType: 'Article28', component: 'Professional', payerType: 'Medicaid', rate: 145 },
  { code: '99205', siteType: 'Article28', component: 'Technical', payerType: 'Medicare', rate: 0 },
  { code: '99205', siteType: 'Article28', component: 'Technical', payerType: 'Commercial', rate: 320 },
  { code: '99205', siteType: 'Article28', component: 'Technical', payerType: 'Medicaid', rate: 0 },
  
  // CPT 78452
  { code: '78452', siteType: 'FPA', component: 'Global', payerType: 'Medicare', rate: 415 },
  { code: '78452', siteType: 'FPA', component: 'Global', payerType: 'Commercial', rate: 666 },
  { code: '78452', siteType: 'FPA', component: 'Global', payerType: 'Medicaid', rate: 186 },
  { code: '78452', siteType: 'Article28', component: 'Professional', payerType: 'Medicare', rate: 67 },
  { code: '78452', siteType: 'Article28', component: 'Professional', payerType: 'Commercial', rate: 98 },
  { code: '78452', siteType: 'Article28', component: 'Professional', payerType: 'Medicaid', rate: 67 },
  { code: '78452', siteType: 'Article28', component: 'Technical', payerType: 'Medicare', rate: 1474 },
  { code: '78452', siteType: 'Article28', component: 'Technical', payerType: 'Commercial', rate: 1933 },
  { code: '78452', siteType: 'Article28', component: 'Technical', payerType: 'Medicaid', rate: 1063 },
  
  // CPT 93351
  { code: '93351', siteType: 'FPA', component: 'Global', payerType: 'Medicare', rate: 262 },
  { code: '93351', siteType: 'FPA', component: 'Global', payerType: 'Commercial', rate: 536 },
  { code: '93351', siteType: 'FPA', component: 'Global', payerType: 'Medicaid', rate: 0 },
  { code: '93351', siteType: 'Article28', component: 'Professional', payerType: 'Medicare', rate: 81 },
  { code: '93351', siteType: 'Article28', component: 'Professional', payerType: 'Commercial', rate: 151 },
  { code: '93351', siteType: 'Article28', component: 'Professional', payerType: 'Medicaid', rate: 80 },
  { code: '93351', siteType: 'Article28', component: 'Technical', payerType: 'Medicare', rate: 580 },
  { code: '93351', siteType: 'Article28', component: 'Technical', payerType: 'Commercial', rate: 1772 },
  { code: '93351', siteType: 'Article28', component: 'Technical', payerType: 'Medicaid', rate: 492 },
];

// Get all CPT code IDs
const allCptCodes = await db.select().from(cptCodes);
const codeMap = new Map(allCptCodes.map(c => [c.code, c.id]));

console.log(`Updating ${rateData.length} rates...`);

let successCount = 0;
for (const item of rateData) {
  const cptCodeId = codeMap.get(item.code);
  if (!cptCodeId) {
    console.error(`CPT code ${item.code} not found`);
    continue;
  }
  
  try {
    await db.update(rates)
      .set({ rate: item.rate * 100 }) // Convert to cents
      .where(and(
        eq(rates.cptCodeId, cptCodeId),
        eq(rates.siteType, item.siteType),
        eq(rates.component, item.component),
        eq(rates.payerType, item.payerType)
      ));
    successCount++;
  } catch (error) {
    console.error(`Error updating ${item.code} ${item.siteType} ${item.component} ${item.payerType}:`, error.message);
  }
}

console.log(`Successfully updated ${successCount}/${rateData.length} rates`);
await connection.end();
