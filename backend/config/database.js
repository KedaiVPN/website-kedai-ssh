const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

// Ensure db directory exists
const dbDir = path.join(__dirname, "../db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "sellvpn.db");
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.exec("PRAGMA foreign_keys = ON;");

// Initialize database tables
const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table for authentication
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          role TEXT DEFAULT 'user',
          auth_provider TEXT DEFAULT 'local',
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create Server table (same as your structure)
      db.run(`
        CREATE TABLE IF NOT EXISTS Server (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          domain TEXT NOT NULL,
          auth TEXT NOT NULL,
          nama_server TEXT NOT NULL,
          quota INTEGER DEFAULT 100,
          iplimit INTEGER DEFAULT 2,
          batas_create_akun INTEGER DEFAULT 1000,
          total_create_akun INTEGER DEFAULT 0,
          protocols TEXT DEFAULT 'ssh,vmess,vless,trojan',
          location TEXT DEFAULT 'Unknown',
          ping INTEGER DEFAULT 0,
          status TEXT DEFAULT 'online'
        )
      `);

      // Create vpn_accounts table (renamed from User)
      db.run(`
        CREATE TABLE IF NOT EXISTS vpn_accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          username TEXT NOT NULL,
          password TEXT,
          protocol TEXT NOT NULL,
          server_id INTEGER NOT NULL,
          duration INTEGER DEFAULT 1,
          quota INTEGER DEFAULT 0,
          ip_limit INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (server_id) REFERENCES Server(id)
        )
      `);

      // Create indexes
      db.run("CREATE INDEX IF NOT EXISTS idx_vpn_accounts_server ON vpn_accounts(server_id)");
      db.run("CREATE INDEX IF NOT EXISTS idx_vpn_accounts_protocol ON vpn_accounts(protocol)");
      db.run("CREATE INDEX IF NOT EXISTS idx_vpn_accounts_user ON vpn_accounts(user_id)");

      // Insert default admin user if not exists
      db.get("SELECT id FROM users WHERE role = 'admin'", [], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";
          bcrypt.hash(defaultPassword, 10, (err, hash) => {
            if (err) {
              reject(err);
              return;
            }
            
            db.run(
              "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
              ["admin", "admin@kedaivpn.com", hash, "admin"],
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  console.log("✅ Default admin user created");
                  resolve();
                }
              }
            );
          });
        } else {
          resolve();
        }
      });
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
        else resolve({ id: this.lastID, lastID: this.lastID, changes: this.changes });
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
