const pool = require('./db/connection');

async function migrate() {
    try {
        console.log('Migrating bug_hosts table...');
        await pool.query(`
            ALTER TABLE bug_hosts
            ADD COLUMN protocol ENUM('ssh', 'xray') NOT NULL DEFAULT 'xray' AFTER id,
            ADD COLUMN payload TEXT,
            ADD COLUMN proxy VARCHAR(255),
            ADD COLUMN sni VARCHAR(255),
            ADD COLUMN is_enhanced TINYINT(1) DEFAULT 0
        `);
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist.');
            process.exit(0);
        } else {
            console.error('Migration failed:', err);
            process.exit(1);
        }
    }
}
migrate();
