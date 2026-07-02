const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await client.connect();
  console.log("Connected to Supabase.");

  const username = 'admin';
  const plainPassword = 'admin123';
  const name = 'Admin';
  const role = 'ADMIN';

  console.log("Hashing password...");
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // Check if admin user already exists
  const checkRes = await client.query('SELECT id FROM users WHERE username = $1;', [username]);

  if (checkRes.rows.length > 0) {
    console.log(`User "${username}" already exists. Updating password and ensuring ADMIN role...`);
    const userId = checkRes.rows[0].id;
    await client.query(`
      UPDATE users 
      SET password_hash = $1, role = $2, name = $3
      WHERE id = $4;
    `, [passwordHash, role, name, userId]);
    console.log("✔ Admin account updated successfully!");
  } else {
    console.log(`User "${username}" does not exist. Creating new ADMIN user...`);
    const userId = require('crypto').randomUUID();
    
    await client.query(`
      INSERT INTO users (id, name, username, password_hash, role, hourly_rate)
      VALUES ($1, $2, $3, $4, $5, 0.00);
    `, [userId, name, username, passwordHash, role]);
    console.log("✔ Admin account created successfully!");
  }

  await client.end();
}

main().catch(console.error);
