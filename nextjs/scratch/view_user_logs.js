const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();
  console.log("Connected.");
  const res = await client.query(`
    SELECT t.id, t.date, t.clock_in, t.clock_out, t.hours, t.user_id,
           s.clock_in as s_in, s.clock_out as s_out
    FROM timesheets t
    LEFT JOIN attendance_sessions s ON s.timesheet_id = t.id
    WHERE t.date >= '2026-07-01'
    ORDER BY t.date DESC, s.clock_in DESC;
  `);
  console.log(res.rows);
  await client.end();
}

main().catch(console.error);
