
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'database.sqlite');
const initSqlPath = path.join(__dirname, 'db', 'init.sql');

// Create db directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Read the init.sql file
const initSql = fs.readFileSync(initSqlPath, 'utf8');

// Create database and run initialization
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database.');
});

// Execute the initialization SQL
db.exec(initSql, (err) => {
  if (err) {
    console.error('Error initializing database:', err.message);
  } else {
    console.log('Database initialized successfully!');
    console.log('Tables created:');
    console.log('- Server');
    console.log('- users');  
    console.log('- vpn_account');
    console.log('- android_metadata');
  }
  
  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});
