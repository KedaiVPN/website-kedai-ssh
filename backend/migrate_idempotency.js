/**
 * Migration script to add idempotency_key to balance_transactions table.
 * Run this script to update existing databases.
 * Usage: node migrate_idempotency.js
 */
const pool = require('./db/connection');

async function migrate() {
  try {
    console.log('Adding idempotency_key to balance_transactions...');

    // Check if column already exists
    const [columns] = await pool.query('DESCRIBE balance_transactions');
    const hasColumn = columns.some(col => col.Field === 'idempotency_key');

    if (hasColumn) {
      console.log('Column idempotency_key already exists.');
    } else {
      await pool.query('ALTER TABLE balance_transactions ADD COLUMN idempotency_key VARCHAR(255) DEFAULT NULL');
      console.log('Column idempotency_key added successfully.');
    }

    // Check if index already exists
    const [indexes] = await pool.query('SHOW INDEX FROM balance_transactions');
    const hasIndex = indexes.some(idx => idx.Key_name === 'idx_balance_transactions_idempotency');

    if (hasIndex) {
      console.log('Index idx_balance_transactions_idempotency already exists.');
    } else {
      await pool.query('CREATE INDEX idx_balance_transactions_idempotency ON balance_transactions(idempotency_key)');
      console.log('Index idx_balance_transactions_idempotency created successfully.');
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
