const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const initSqlPath = path.join(__dirname, 'db', 'init.sql');

async function setupDatabase() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_DATABASE } = process.env;

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_DATABASE) {
    console.error('Error: Database environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE) must be set.');
    process.exit(1);
  }

  let connection;
  try {
    // 1. Connect to the MySQL server (without selecting a database) to create it
    console.log(`Connecting to MySQL server at ${DB_HOST}...`);
    const serverConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT || 3306,
    });
    console.log('Connected to MySQL server.');

    // 2. Create the database if it doesn't exist
    console.log(`Creating database '${DB_DATABASE}' if it doesn't exist...`);
    await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\``);
    await serverConnection.end();
    console.log(`Database '${DB_DATABASE}' is ready.`);

    // 3. Connect to the specific database
    console.log(`Connecting to database '${DB_DATABASE}'...`);
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE,
      port: DB_PORT || 3306,
      multipleStatements: true // IMPORTANT: Allow multiple statements for init.sql
    });
    console.log('Successfully connected to the database.');

    // 4. Read and execute the init.sql file
    console.log('Reading init.sql file...');
    const initSql = await fs.readFile(initSqlPath, 'utf8');
    console.log('Executing init.sql script...');
    await connection.query(initSql);
    console.log('Successfully executed init.sql script.');

    // 5. Verify that tables were created
    console.log('Verifying table creation...');
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length > 0) {
      console.log('Tables created successfully:');
      tables.forEach(table => {
        console.log(`- ${Object.values(table)[0]}`);
      });
    } else {
      throw new Error('Verification failed: No tables were created.');
    }

    console.log('\nDatabase setup completed successfully! 🎉');

  } catch (error) {
    console.error('\nDatabase setup failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

setupDatabase();
