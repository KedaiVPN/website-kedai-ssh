const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Ensure db directory exists
const dbDir = path.join(__dirname, "../db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const DB_PATH = path.join(__dirname, "../db/kedaivpn.db");

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");
  }
});

// Database initialization function
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT,
          source TEXT NOT NULL DEFAULT 'email',
          role TEXT NOT NULL DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1
        )
      `, (err) => {
        if (err) console.error("Error creating users table:", err);
        else console.log("✅ Users table ready");
      });

      // Servers table
      db.run(`
        CREATE TABLE IF NOT EXISTS servers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          domain TEXT NOT NULL,
          location TEXT NOT NULL,
          auth TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'online',
          protocols TEXT NOT NULL,
          ping INTEGER DEFAULT 0,
          users INTEGER DEFAULT 0,
          max_users INTEGER DEFAULT 100,
          batas_create_akun INTEGER DEFAULT 50,
          total_create_akun INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1
        )
      `, (err) => {
        if (err) console.error("Error creating servers table:", err);
        else console.log("✅ Servers table ready");
      });

      // VPN Accounts table
      db.run(`
        CREATE TABLE IF NOT EXISTS vpn_accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          server_id INTEGER NOT NULL,
          username TEXT NOT NULL,
          password TEXT,
          uuid TEXT,
          protocol TEXT NOT NULL,
          domain TEXT NOT NULL,
          expired_at DATETIME NOT NULL,
          quota_gb INTEGER,
          ip_limit INTEGER DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error("Error creating vpn_accounts table:", err);
        else console.log("✅ VPN Accounts table ready");
      });

      // Admin sessions table
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error("Error creating admin_sessions table:", err);
        else console.log("✅ Admin Sessions table ready");
      });

      // Create indexes for better performance
      db.run("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
      db.run("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)");
      db.run("CREATE INDEX IF NOT EXISTS idx_vpn_accounts_user_id ON vpn_accounts(user_id)");
      db.run("CREATE INDEX IF NOT EXISTS idx_vpn_accounts_server_id ON vpn_accounts(server_id)");
      db.run("CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token)");

      // Insert default admin user if not exists
      db.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1", (err, row) => {
        if (!row) {
          const bcrypt = require("bcrypt");
          const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";
          
          bcrypt.hash(defaultPassword, 10, (err, hashedPassword) => {
            if (!err) {
              db.run(`
                INSERT INTO users (username, email, password, source, role) 
                VALUES (?, ?, ?, ?, ?)
              `, ['admin', 'admin@kedaivpn.com', hashedPassword, 'email', 'admin'], (err) => {
                if (!err) {
                  console.log("✅ Default admin user created");
                  console.log("📧 Email: admin@kedaivpn.com");
                  console.log(`🔐 Password: ${defaultPassword}`);
                }
              });
            }
          });
        }
      });

      console.log("✅ Database initialization complete");
      resolve();
    });
  });
};

// Database utility functions
const dbUtils = {
  // Get database instance
  getDb: () => db,
  
  // Run query with promise
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  
  // Get single row
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  // Get all rows
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  // Close database connection
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

module.exports = { initDatabase, db, dbUtils };