
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
expired_date TEXT,              -- kapan akun akan expired
-- SSH specific fields
ssh_ws_port TEXT DEFAULT '80',
ssh_ssl_port TEXT DEFAULT '443',
-- V2Ray specific fields
uuid TEXT,                      -- untuk vmess/vless/trojan
ns_domain TEXT,                 -- nameserver domain
-- URLs for V2Ray protocols
vmess_tls_link TEXT,
vmess_nontls_link TEXT,
vmess_grpc_link TEXT,
vless_tls_link TEXT,
vless_nontls_link TEXT,
vless_grpc_link TEXT,
trojan_tls_link TEXT,
trojan_nontls_link1 TEXT,
trojan_grpc_link TEXT,
FOREIGN KEY (server_id) REFERENCES Server(id),
FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE android_metadata (locale TEXT);

CREATE INDEX idx_vpn_account_server ON vpn_account(server_id);
CREATE INDEX idx_vpn_account_protocol ON vpn_account(protocol);
CREATE INDEX idx_vpn_account_user ON vpn_account(user_id);
CREATE INDEX idx_vpn_account_expired ON vpn_account(expired_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

COMMIT;
