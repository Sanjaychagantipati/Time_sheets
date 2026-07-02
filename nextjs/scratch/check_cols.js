const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();
  console.log("Connected to Supabase.");
  
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  
  for (const row of tablesRes.rows) {
    const tableName = row.table_name;
    const colRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public';
    `, [tableName]);
    
    console.log(`\nTable: ${tableName}`);
    console.log(colRes.rows);
  }
  
  await client.end();
}

main().catch(console.error);
