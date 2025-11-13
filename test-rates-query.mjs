import { drizzle } from 'drizzle-orm/mysql2';
import { rates, cptCodes } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

const allRates = await db.select({
  id: rates.id,
  cptCodeId: rates.cptCodeId,
  code: cptCodes.code,
  siteType: rates.siteType,
  component: rates.component,
  payerType: rates.payerType,
  rate: rates.rate
}).from(rates)
  .leftJoin(cptCodes, eq(rates.cptCodeId, cptCodes.id))
  .where(eq(cptCodes.code, '99213'));

console.log('Rates for 99213:');
console.log(JSON.stringify(allRates, null, 2));
process.exit(0);
