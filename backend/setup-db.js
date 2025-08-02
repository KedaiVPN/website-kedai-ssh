
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'database.sqlite');
const initSqlPath = path.join(__dirname, 'db', 'init.sql');

console.log('Database setup starting...');
console.log('Database path:', dbPath);
console.log('Init SQL path:', initSqlPath);

// Create db directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  console.log('Creating db directory...');
  fs.mkdirSync(dbDir, { recursive: true });
} else {
  console.log('DB directory already exists');
}

// Remove existing database file if it exists
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database file...');
  fs.unlinkSync(dbPath);
}

// Check if init.sql exists
if (!fs.existsSync(initSqlPath)) {
  console.error('Error: init.sql file not found at:', initSqlPath);
  process.exit(1);
}

// Read the init.sql file
console.log('Reading init.sql file...');
const initSql = fs.readFileSync(initSqlPath, 'utf8');
console.log('SQL content length:', initSql.length, 'characters');

// Create database and run initialization
console.log('Creating new SQLite database...');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database successfully.');
});

// Split SQL into individual statements for better error handling
const statements = initSql
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.match(/^\s*(BEGIN|COMMIT)/i));

console.log('Found', statements.length, 'SQL statements to execute');

// Execute statements one by one
let completedStatements = 0;

const executeNextStatement = (index) => {
  if (index >= statements.length) {
    console.log('All statements executed successfully!');
    
    // Verify tables were created
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error('Error verifying tables:', err.message);
      } else {
        console.log('Tables created successfully:');
        tables.forEach(table => {
          console.log('- ' + table.name);
        });
      }
      
      // Close the database connection
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed.');
          console.log('Database setup completed successfully!');
        }
      });
    });
    return;
  }

  const statement = statements[index];
  console.log(`Executing statement ${index + 1}/${statements.length}:`, statement.substring(0, 50) + '...');
  
  db.run(statement, (err) => {
    if (err) {
      console.error(`Error executing statement ${index + 1}:`, err.message);
      console.error('Failed statement:', statement);
      process.exit(1);
    } else {
      completedStatements++;
      console.log(`Statement ${index + 1} completed successfully`);
      executeNextStatement(index + 1);
    }
  });
};

// Start executing statements
executeNextStatement(0);
