const fs = require('fs');
const path = require('path');
const pool = require('./db/connection');

const initSqlPath = path.join(__dirname, 'db', 'init.sql');

async function setupDatabase() {
  console.log('Database setup starting for MySQL...');

  // Check if init.sql exists
  if (!fs.existsSync(initSqlPath)) {
    console.error('Error: init.sql file not found at:', initSqlPath);
    process.exit(1);
  }

  // Read the init.sql file
  console.log('Reading init.sql file...');
  const initSql = fs.readFileSync(initSqlPath, 'utf8');
  console.log('SQL content length:', initSql.length, 'characters');

  // Split SQL into individual statements
  const statements = initSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  console.log('Found', statements.length, 'SQL statements to execute');

  let connection;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    console.log('Connected to MySQL database successfully.');

    // Execute statements one by one
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}:`, statement.substring(0, 80) + '...');
      await connection.query(statement);
      console.log(`Statement ${i + 1} executed successfully.`);
    }

    console.log('All SQL statements executed successfully!');
    console.log('Database setup completed successfully!');
  } catch (err) {
    console.error('Error during database setup:', err.message);
    if (err.sql) {
      console.error('Failed SQL statement:', err.sql);
    }
    process.exit(1);
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
      console.log('MySQL connection released.');
    }
    // Close the pool
    pool.end();
  }
}

setupDatabase();
