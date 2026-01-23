
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

async function migrate() {
  let connection;
  try {
    console.log('Connecting to database...', {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_DATABASE
    });

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });

    console.log('Checking for phone_number column in users table...');

    // Check if column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'phone_number'
    `, [process.env.DB_DATABASE]);

    if (columns.length === 0) {
      console.log('Adding phone_number column...');
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN phone_number VARCHAR(50) DEFAULT NULL AFTER email
      `);
      console.log('Adding index on phone_number...');
      await connection.query(`
        CREATE INDEX idx_users_phone ON users(phone_number)
      `);
      console.log('Migration successful: phone_number column added.');
    } else {
      console.log('Column phone_number already exists.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) await connection.end();
    process.exit();
  }
}

migrate();
