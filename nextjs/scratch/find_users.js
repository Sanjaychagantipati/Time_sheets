const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT id, name, username, role FROM users;');
  console.log(res.rows);
  await client.end();
}

main().catch(console.error);
