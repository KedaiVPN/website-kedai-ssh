const pool = require('./db/connection');

async function migrate() {
  console.log('Starting migration: adding link_format to bug_hosts...');
  try {
    const query = "ALTER TABLE bug_hosts ADD COLUMN link_format ENUM('tls', 'nontls', 'grpc') NOT NULL DEFAULT 'tls' AFTER protocol;";
    await pool.query(query);
    console.log('Migration successful: link_format added to bug_hosts.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Migration skipped: link_format column already exists.');
    } else {
      console.error('Migration failed:', err.message);
      process.exit(1);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
