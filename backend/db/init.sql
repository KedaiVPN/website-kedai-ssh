
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
reset_token TEXT,  -- Token untuk reset password
reset_token_expires_at TEXT,  -- Expiry time untuk reset token
reset_attempts INTEGER DEFAULT 0,  -- Counter attempts reset password
balance INTEGER DEFAULT 0,  -- Balance in Rupiah
is_locked BOOLEAN DEFAULT 0,  -- Lock status for user access
role TEXT DEFAULT 'member' CHECK (role IN ('member', 'reseller')),  -- User role system
created_vpn INTEGER DEFAULT 0,
total_transaksi INTEGER DEFAULT 0,
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT UNIQUE NOT NULL,
email TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ... keep existing code (vpn_account, balance_transactions, pricing_config, topup_transactions, android_metadata tables)

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

CREATE TABLE topup_transactions (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
amount INTEGER NOT NULL, -- Net amount (saldo yang masuk)
amount_gross INTEGER, -- Gross amount (total yang dibayar customer)
duitku_reference TEXT UNIQUE NOT NULL, -- reference from Duitku
duitku_merchant_order_id TEXT UNIQUE NOT NULL, -- merchant order ID
payment_method TEXT, -- payment method used (QRIS, VA, etc)
status TEXT DEFAULT 'pending', -- pending, success, failed, expired
callback_url TEXT,
return_url TEXT,
payment_url TEXT, -- URL for user to complete payment (for REDIRECT flow)
qr_code_url TEXT, -- URL of the QR code image (for DIRECT flow)
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE android_metadata (locale TEXT);

-- Messages feature tables
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    target_role TEXT CHECK(target_role IN ('all', 'member', 'reseller')) NOT NULL,
    duration_days INTEGER, -- NULL for permanent
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_admin_id INTEGER NOT NULL,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id)
);

CREATE TABLE message_reads (
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


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
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX idx_balance_transactions_type ON balance_transactions(type);
CREATE INDEX idx_balance_transactions_reference ON balance_transactions(reference_type, reference_id);
CREATE INDEX idx_balance_transactions_created ON balance_transactions(created_at);
CREATE INDEX idx_pricing_config_ip_limit ON pricing_config(ip_limit);
CREATE INDEX idx_topup_transactions_user ON topup_transactions(user_id);
CREATE INDEX idx_topup_transactions_status ON topup_transactions(status);
CREATE INDEX idx_topup_transactions_duitku_ref ON topup_transactions(duitku_reference);
CREATE INDEX idx_topup_transactions_created ON topup_transactions(created_at);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_messages_target_role ON messages(target_role);
CREATE INDEX idx_messages_expires_at ON messages(expires_at);
CREATE INDEX idx_message_reads_user_id ON message_reads(user_id);

COMMIT;
