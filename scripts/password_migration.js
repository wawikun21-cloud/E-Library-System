// ============================================================================
// PASSWORD MIGRATION SCRIPT
// Lexora Library Management System
// ============================================================================

require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPasswordHash() {
  const testPassword = 'TestPassword123!';
  
  log('\n=================================================', 'cyan');
  log('  TESTING PASSWORD HASHING', 'cyan');
  log('=================================================\n', 'cyan');
  
  log(`Test password: ${testPassword}`, 'blue');
  log(`Bcrypt rounds: ${BCRYPT_ROUNDS}`, 'blue');
  
  const startTime = Date.now();
  const hash = await bcrypt.hash(testPassword, BCRYPT_ROUNDS);
  const endTime = Date.now();
  
  log(`Generated hash: ${hash}`, 'green');
  log(`Time taken: ${endTime - startTime}ms`, 'blue');
  
  // Test comparison
  const isMatch = await bcrypt.compare(testPassword, hash);
  log(`Password verification: ${isMatch ? '✓ PASS' : '✗ FAIL'}`, isMatch ? 'green' : 'red');
  
  const wrongPassword = await bcrypt.compare('WrongPassword', hash);
  log(`Wrong password rejection: ${!wrongPassword ? '✓ PASS' : '✗ FAIL'}`, !wrongPassword ? 'green' : 'red');
}

async function hashExistingPasswords() {
  let connection;

  try {
    log('\n=================================================', 'cyan');
    log('  PASSWORD MIGRATION SCRIPT', 'cyan');
    log('=================================================\n', 'cyan');

    log('Connecting to database...', 'blue');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lexora_db'
    });
    log('✓ Database connection established', 'green');

    const [users] = await connection.execute(
      `SELECT user_id, username, password 
       FROM users 
       WHERE password IS NOT NULL 
       AND (password_hash IS NULL OR password_hash = '')`
    );

    if (users.length === 0) {
      log('✓ No plaintext passwords found!', 'green');
      await connection.end();
      return;
    }

    log(`Found ${users.length} users with plaintext passwords`, 'yellow');

    let successCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const progress = `[${i + 1}/${users.length}]`;

      try {
        log(`${progress} Hashing password for ${user.username}...`, 'blue');
        const hash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
        
        await connection.execute(
          `UPDATE users SET password_hash = ?, last_password_change = NOW() WHERE user_id = ?`,
          [hash, user.user_id]
        );

        log(`${progress} ✓ Done`, 'green');
        successCount++;

      } catch (error) {
        log(`${progress} ✗ Error: ${error.message}`, 'red');
      }
    }

    log(`\n✓ Successfully hashed ${successCount} passwords`, 'green');

  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
  } finally {
    if (connection) await connection.end();
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      await testPasswordHash();
      break;
    case 'migrate':
      await hashExistingPasswords();
      break;
    default:
      log('\nUsage:', 'blue');
      log('  node password_migration.js test     - Test bcrypt', 'yellow');
      log('  node password_migration.js migrate  - Hash passwords\n', 'yellow');
  }
}

main().catch(console.error);