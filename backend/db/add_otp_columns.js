const pool = require('./connection');

async function migrate() {
  try {
    console.log('Starting migration to add OTP columns...');
    const connection = await pool.getConnection();

    try {
      // Check if columns exist
      const [columns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'otp_token'`);

      if (columns.length === 0) {
        console.log('Adding otp_token, otp_expires_at, and otp_type columns...');
        await connection.query(`
          ALTER TABLE users
          ADD COLUMN otp_token VARCHAR(255) NULL,
          ADD COLUMN otp_expires_at DATETIME NULL,
          ADD COLUMN otp_type VARCHAR(50) NULL
        `);
        console.log('Columns added successfully.');
      } else {
        console.log('Columns already exist. Skipping.');
      }
    } finally {
      connection.release();
    }

    console.log('Migration completed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
