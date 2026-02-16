#!/usr/bin/env node
// ============================================================
// ONE-TIME MIGRATION: Hash all plaintext passwords
// Run ONCE after applying migration_add_password_hash.sql
// ============================================================
// Usage: node scripts/hash_passwords.js
// ============================================================

require('dotenv').config({ path: '../server/.env' });
const bcrypt = require('bcrypt');
const mysql  = require('mysql2/promise');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

async function run() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'lexora_db',
  });

  console.log('Connected to database.');

  // Fetch only users that still need hashing
  const [users] = await db.execute(
    'SELECT user_id, username, password FROM users WHERE password IS NOT NULL AND password_hash IS NULL'
  );

  if (users.length === 0) {
    console.log('No plaintext passwords found — nothing to migrate.');
    await db.end();
    return;
  }

  console.log(`Hashing ${users.length} password(s) with bcrypt (rounds: ${ROUNDS})...`);

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, ROUNDS);
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [hash, user.user_id]
    );
    console.log(`  ✔ ${user.username}`);
  }

  // Verify no rows were missed
  const [remaining] = await db.execute(
    'SELECT COUNT(*) AS cnt FROM users WHERE password_hash IS NULL'
  );
  const missed = remaining[0].cnt;

  if (missed > 0) {
    console.error(`\n✘ ${missed} row(s) still have NULL password_hash. DO NOT drop the password column yet.`);
  } else {
    console.log('\n✔ All passwords hashed successfully.');
    console.log('You can now run the following SQL to drop the plaintext column:');
    console.log('  ALTER TABLE users DROP COLUMN password;');
  }

  await db.end();
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
