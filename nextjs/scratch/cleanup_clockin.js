const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();
  console.log("Connected.");
  const resSessions = await client.query(`
    DELETE FROM attendance_sessions WHERE timesheet_id = '00f0083e-33c0-4ea6-959a-b234e5fd65e2';
  `);
  console.log("Deleted sessions. Rows affected:", resSessions.rowCount);
  const res = await client.query(`
    DELETE FROM timesheets WHERE id = '00f0083e-33c0-4ea6-959a-b234e5fd65e2';
  `);
  console.log("Deleted timesheet for July 2nd. Rows affected:", res.rowCount);
  await client.end();
}

main().catch(console.error);
