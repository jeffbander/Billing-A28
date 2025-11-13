import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const sql = readFileSync('update_rates.sql', 'utf-8');
const statements = sql.split('\n').filter(line => line.trim().startsWith('UPDATE'));

console.log(`Executing ${statements.length} UPDATE statements...`);

let successCount = 0;
for (const statement of statements) {
  try {
    await connection.execute(statement);
    successCount++;
  } catch (error) {
    console.error(`Error executing: ${statement}`);
    console.error(error.message);
  }
}

console.log(`Successfully executed ${successCount}/${statements.length} updates`);
await connection.end();
