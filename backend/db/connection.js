const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test the connection on startup
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the MySQL database pool.');
    connection.release();
  })
  .catch(error => {
    console.error('Error connecting to the MySQL database:', error.message);
    // Exit process on critical connection error
    process.exit(1);
  });

module.exports = pool;
