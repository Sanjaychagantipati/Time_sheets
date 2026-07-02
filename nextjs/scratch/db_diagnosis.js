const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log("Connecting to Supabase PostgreSQL database...");
  const start = Date.now();
  await client.connect();
  const latency = Date.now() - start;
  console.log(`Successfully connected! Latency: ${latency}ms\n`);

  const tables = ['users', 'clients', 'holidays', 'timesheets', 'attendance_sessions'];
  console.log("=== Checking Required Tables ===");
  
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM "${table}";`);
      console.log(`✔ Table "${table}" exists. Row count: ${res.rows[0].count}`);
    } catch (err) {
      console.log(`❌ Table "${table}" CHECK FAILED:`, err.message);
    }
  }

  console.log("\n=== Checking for Unnecessary/Extra Tables ===");
  const extraRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name NOT IN ('users', 'clients', 'holidays', 'timesheets', 'attendance_sessions');
  `);

  if (extraRes.rows.length === 0) {
    console.log("✔ No unnecessary or extra tables found in the database. It is 100% clean!");
  } else {
    console.log(`Found ${extraRes.rows.length} extra table(s):`);
    extraRes.rows.forEach(r => console.log(`- ${r.table_name}`));
  }

  await client.end();
}

main().catch(console.error);
