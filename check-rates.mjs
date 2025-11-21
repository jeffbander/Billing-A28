import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const [rows] = await connection.execute(`
  SELECT r.id, r.rate, r.component, r.siteType, r.payerType, c.code, c.description
  FROM rates r
  JOIN cpt_codes c ON r.cptCodeId = c.id
  WHERE c.code = '93306' AND r.payerType = 'Medicare'
  ORDER BY r.component, r.siteType
`);

console.log('Rates for CPT 93306 (Medicare):');
console.log(JSON.stringify(rows, null, 2));

await connection.end();
