const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();
  console.log("Connected.");
  
  // Find timesheets for today
  const res = await client.query(`
    SELECT id FROM timesheets WHERE date = '2026-07-02';
  `);
  
  for (const row of res.rows) {
    await client.query(`
      DELETE FROM attendance_sessions WHERE timesheet_id = $1;
    `, [row.id]);
    await client.query(`
      DELETE FROM timesheets WHERE id = $1;
    `, [row.id]);
    console.log(`Deleted timesheet ${row.id} for today.`);
  }
  
  await client.end();
}

main().catch(console.error);
