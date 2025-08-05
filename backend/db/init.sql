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
email_verified BOOLEAN DEFAULT 1,  -- Default TRUE untuk backward compatibility
verification_token TEXT,
verification_expires_at TEXT,
verification_attempts INTEGER DEFAULT 0,
balance INTEGER DEFAULT 0,  -- Balance in Rupiah
is_locked BOOLEAN DEFAULT 0,  -- Lock status for user access
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

CREATE TABLE balance_transactions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
type TEXT NOT NULL, -- 'debit' or 'credit'
amount INTEGER NOT NULL, -- amount in Rupiah
description TEXT NOT NULL,
reference_type TEXT, -- 'account_creation', 'topup', 'refund', etc.
reference_id INTEGER, -- reference to related record (e.g., vpn_account.id)
balance_before INTEGER NOT NULL,
balance_after INTEGER NOT NULL,
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE pricing_config (
id INTEGER PRIMARY KEY AUTOINCREMENT,
ip_limit INTEGER UNIQUE NOT NULL,
daily_price INTEGER NOT NULL, -- price per day in Rupiah
description TEXT,
is_active BOOLEAN DEFAULT 1,
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE android_metadata (locale TEXT);

-- Insert the new pricing structure
INSERT INTO pricing_config (ip_limit, daily_price, description) VALUES 
(1, 330, '1 IP - Satu perangkat'),
(2, 430, '2 IP - Dua perangkat'), 
(4, 600, '4 IP/STB - Empat perangkat / STB OpenWRT');

-- Create indexes
CREATE INDEX idx_vpn_account_server ON vpn_account(server_id);
CREATE INDEX idx_vpn_account_protocol ON vpn_account(protocol);
CREATE INDEX idx_vpn_account_user ON vpn_account(user_id);
CREATE INDEX idx_vpn_account_expired ON vpn_account(expired_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_verification ON users(verification_token);
CREATE INDEX idx_users_locked ON users(is_locked);
CREATE INDEX idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX idx_balance_transactions_type ON balance_transactions(type);
CREATE INDEX idx_balance_transactions_reference ON balance_transactions(reference_type, reference_id);
CREATE INDEX idx_balance_transactions_created ON balance_transactions(created_at);
CREATE INDEX idx_pricing_config_ip_limit ON pricing_config(ip_limit);

COMMIT;
