const pool = require('./db/connection');

async function migrate() {
  console.log('Migrating system_settings table...');
  try {
    const connection = await pool.getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          setting_key VARCHAR(50) PRIMARY KEY,
          setting_value VARCHAR(255) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Table system_settings created or already exists.');

      await connection.query(`
        INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES ('active_payment_gateway', 'TRIPAY');
      `);
      console.log('Default value for active_payment_gateway inserted.');

    } finally {
      connection.release();
    }
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
