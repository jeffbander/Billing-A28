import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { cptCodes } from '../drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

/**
 * CMS 2025 Work RVU values for existing CPT codes
 * Source: CMS Physician Fee Schedule
 */
const rvuData = [
  // Imaging procedures
  { code: '78452', workRvu: '4.75', procedureType: 'imaging', description: 'Myocardial Perfusion Imaging' },
  { code: '93306', workRvu: '1.40', procedureType: 'imaging', description: 'Echocardiography, complete' },
  { code: '93351', workRvu: '1.60', procedureType: 'imaging', description: 'Echocardiography, stress test' },
  
  // Office visits
  { code: '99203', workRvu: '1.60', procedureType: 'visit', description: 'Office Visit - New Patient Level 3' },
  { code: '99204', workRvu: '2.60', procedureType: 'visit', description: 'Office Visit - New Patient Level 4' },
  { code: '99205', workRvu: '3.50', procedureType: 'visit', description: 'Office Visit - New Patient Level 5' },
  { code: '99213', workRvu: '0.97', procedureType: 'visit', description: 'Office visit, established patient, moderate complexity' },
  { code: '99214', workRvu: '1.50', procedureType: 'visit', description: 'Office visit, established patient, high complexity' },
  { code: '99215', workRvu: '2.10', procedureType: 'visit', description: 'Office visit, established patient, highest complexity' },
];

async function populateRvuData() {
  console.log('Starting RVU data population...\n');
  
  for (const data of rvuData) {
    try {
      // Find the CPT code
      const existing = await db.select().from(cptCodes).where(eq(cptCodes.code, data.code)).limit(1);
      
      if (existing.length === 0) {
        console.log(`⚠️  CPT code ${data.code} not found, skipping...`);
        continue;
      }
      
      // Update with RVU data
      await db.update(cptCodes)
        .set({
          workRvu: data.workRvu,
          procedureType: data.procedureType,
        })
        .where(eq(cptCodes.code, data.code));
      
      console.log(`✅ Updated ${data.code} - ${data.description}`);
      console.log(`   Work RVU: ${data.workRvu}, Type: ${data.procedureType}\n`);
    } catch (error) {
      console.error(`❌ Error updating ${data.code}:`, error.message);
    }
  }
  
  console.log('\n✅ RVU data population complete!');
  process.exit(0);
}

populateRvuData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
