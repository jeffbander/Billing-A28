import { drizzle } from 'drizzle-orm/mysql2';
import { cptCodes } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const newCptCodes = [
  { code: '99203', description: 'Office Visit - New Patient Level 3' },
  { code: '99204', description: 'Office Visit - New Patient Level 4' },
  { code: '99205', description: 'Office Visit - New Patient Level 5' },
  { code: '78452', description: 'Myocardial Perfusion Imaging' },
];

async function addCptCodes() {
  console.log('Adding missing CPT codes...');
  
  for (const cpt of newCptCodes) {
    try {
      await db.insert(cptCodes).values(cpt);
      console.log(`Added CPT ${cpt.code}: ${cpt.description}`);
    } catch (error) {
      console.error(`Error adding CPT ${cpt.code}:`, error.message);
    }
  }
  
  console.log('Done!');
}

addCptCodes().catch(console.error);
