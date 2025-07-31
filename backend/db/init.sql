BEGIN TRANSACTION;
CREATE TABLE Server (
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
);

CREATE TABLE users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT UNIQUE NOT NULL,
email TEXT UNIQUE NOT NULL,
password_hash TEXT,  -- NULL untuk Google OAuth users
auth_provider TEXT DEFAULT 'email',  -- 'email' atau 'google'
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vpn_account (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT NOT NULL,
password TEXT,
protocol TEXT NOT NULL,         -- ssh / vmess / vless / trojan
server_id INTEGER NOT NULL,     -- relasi ke Server.id
user_id INTEGER,                -- relasi ke users.id (bisa NULL untuk guest)
duration INTEGER DEFAULT 1,     -- hari
quota INTEGER DEFAULT 0,        -- MB
ip_limit INTEGER DEFAULT 1,     -- IP
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (server_id) REFERENCES Server(id),
FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE android_metadata (locale TEXT);

CREATE INDEX idx_vpn_account_server ON vpn_account(server_id);
CREATE INDEX idx_vpn_account_protocol ON vpn_account(protocol);
CREATE INDEX idx_vpn_account_user ON vpn_account(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

COMMIT;
