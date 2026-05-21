CREATE TABLE Server (
  id INT PRIMARY KEY AUTO_INCREMENT,
  domain VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  nama_server VARCHAR(255) NOT NULL,
  quota INT DEFAULT 100,
  iplimit INT DEFAULT 2,
  batas_create_akun INT DEFAULT 1000,
  total_create_akun INT DEFAULT 0,
  protocols VARCHAR(255) DEFAULT 'ssh,vmess,vless,trojan',
  location VARCHAR(255) DEFAULT 'Unknown',
  ping INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'online',
  url_monitoring VARCHAR(255) NULL,
  ip_server VARCHAR(255) NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE server_pricing (
  server_id INT PRIMARY KEY,
  member_1ip INT DEFAULT 330,
  member_2ip INT DEFAULT 430,
  member_4ip INT DEFAULT 600,
  reseller_1ip INT DEFAULT 165,
  reseller_2ip INT DEFAULT 215,
  reseller_4ip INT DEFAULT 300,
  FOREIGN KEY (server_id) REFERENCES Server(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  auth_provider VARCHAR(50) DEFAULT 'email',
  phone_number VARCHAR(50) DEFAULT NULL,
  email_verified TINYINT(1) DEFAULT 1,
  verification_token VARCHAR(255),
  verification_expires_at DATETIME NULL,
  verification_attempts INT DEFAULT 0,
  reset_token VARCHAR(255),
  reset_token_expires_at DATETIME NULL,
  reset_attempts INT DEFAULT 0,
  balance INT DEFAULT 0,
  is_locked TINYINT(1) DEFAULT 0,
  role ENUM('member', 'reseller') DEFAULT 'member',
  reseller_since DATETIME NULL DEFAULT NULL,
  created_vpn INT DEFAULT 0,
  total_transaksi INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE vpn_account (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  protocol VARCHAR(50) NOT NULL,
  server_id INT NOT NULL,
  user_id INT,
  duration INT DEFAULT 1,
  quota INT DEFAULT 0,
  ip_limit INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expired_date DATETIME NULL,
  ssh_ws_port VARCHAR(10) DEFAULT '80',
  ssh_ssl_port VARCHAR(10) DEFAULT '443',
  uuid VARCHAR(255),
  ns_domain VARCHAR(255),
  vmess_tls_link TEXT,
  vmess_nontls_link TEXT,
  vmess_grpc_link TEXT,
  vless_tls_link TEXT,
  vless_nontls_link TEXT,
  vless_grpc_link TEXT,
  trojan_tls_link TEXT,
  trojan_nontls_link1 TEXT,
  trojan_go_link TEXT,
  trojan_grpc_link TEXT,
  zivpn_link TEXT,
  FOREIGN KEY (server_id) REFERENCES Server(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE balance_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount INT NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(255),
  reference_id INT,
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  idempotency_key VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE pricing_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip_limit INT UNIQUE NOT NULL,
  daily_price INT NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE topup_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  amount_gross INT,
  duitku_reference VARCHAR(255) UNIQUE NOT NULL,
  duitku_merchant_order_id VARCHAR(255) UNIQUE NOT NULL,
  payment_method VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  callback_url TEXT,
  return_url TEXT,
  payment_url TEXT,
  qr_code_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE android_metadata (locale VARCHAR(255)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('announcement', 'banner') NOT NULL DEFAULT 'announcement',
    target_pages JSON,
    target_role ENUM('all', 'member', 'reseller') NOT NULL,
    duration_days INT,
    expires_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_admin_id INT NOT NULL,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE message_reads (
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE bug_hosts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    is_wildcard TINYINT(1) NOT NULL DEFAULT 0,
    is_salto TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO pricing_config (ip_limit, daily_price, description) VALUES
(1, 330, '1 IP - Satu perangkat'),
(2, 430, '2 IP - Dua perangkat'),
(4, 600, '4 IP/STB - Empat perangkat / STB OpenWRT');

CREATE INDEX idx_vpn_account_server ON vpn_account(server_id);
CREATE INDEX idx_vpn_account_protocol ON vpn_account(protocol);
CREATE INDEX idx_vpn_account_user ON vpn_account(user_id);
CREATE INDEX idx_vpn_account_expired ON vpn_account(expired_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_verification ON users(verification_token);
CREATE INDEX idx_users_locked ON users(is_locked);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_reset_token ON users(reset_token);
CREATE INDEX idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX idx_balance_transactions_type ON balance_transactions(type);
CREATE INDEX idx_balance_transactions_reference ON balance_transactions(reference_type, reference_id);
CREATE INDEX idx_balance_transactions_created ON balance_transactions(created_at);
CREATE INDEX idx_balance_transactions_idempotency ON balance_transactions(idempotency_key);
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
CREATE INDEX idx_bug_hosts_label ON bug_hosts(label);

-- XL Paket Tables
CREATE TABLE IF NOT EXISTS xl_packages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  package_code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  fee INT NOT NULL COMMENT 'Fee untuk website (yang dipotong dari saldo user)',
  is_active TINYINT(1) DEFAULT 1,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'e-wallet',
  kategori ENUM('resmi', 'tidak resmi') NOT NULL DEFAULT 'tidak resmi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_code (package_code)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS xl_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  package_code VARCHAR(100) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  trx_id VARCHAR(100) UNIQUE,
  payment_method VARCHAR(50) NOT NULL,
  fee INT NOT NULL COMMENT 'Fee yang dipotong',
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  payment_url TEXT NULL,
  qr_code TEXT NULL,
  deeplink_url TEXT NULL,
  payment_expired_at INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_trx (trx_id),
  INDEX idx_status (status)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- DigitalOcean Management Tables
CREATE TABLE IF NOT EXISTS digitalocean_apikeys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_keys (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `digitalocean_sshkeys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `fingerprint` varchar(255) NOT NULL,
  `public_key` text NOT NULL,
  `digitalocean_id` int(11) NOT NULL,
  `api_key_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`api_key_id`) REFERENCES `digitalocean_apikeys`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Blog / Tutorial Tables
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE COMMENT 'Permalink for SEO',
  content LONGTEXT NOT NULL,
  featured_image_url VARCHAR(255),
  author_id INT NOT NULL,
  meta_description VARCHAR(255),
  excerpt TEXT,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  FOREIGN KEY (author_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_author (author_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_categories (
  article_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (article_id, category_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS xl_scheduled_purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  package_code VARCHAR(100) NOT NULL,
  scheduled_date DATE NOT NULL,
  status ENUM('active', 'completed', 'failed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (package_code) REFERENCES xl_packages(package_code) ON DELETE CASCADE,
  INDEX idx_scheduled_date_status (scheduled_date, status),
  INDEX idx_user_phone (user_id, phone_number)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Digiflazz (Game Topup) Tables
CREATE TABLE IF NOT EXISTS digiflazz_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_sku_code VARCHAR(100) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  custom_product_name VARCHAR(255) NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  type VARCHAR(100),
  price INT NOT NULL,
  seller_price INT,
  selling_price INT,
  is_active TINYINT(1) DEFAULT 1,
  stock INT DEFAULT 0,
  unlimited_stock TINYINT(1) DEFAULT 1,
  description TEXT,
  image_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_brand (brand),
  INDEX idx_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Digiflazz Pulsa Products
CREATE TABLE IF NOT EXISTS digiflazz_pulsa_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_sku_code VARCHAR(100) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  custom_product_name VARCHAR(255) NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  type VARCHAR(100),
  price INT NOT NULL,
  seller_price INT,
  selling_price INT,
  is_active TINYINT(1) DEFAULT 1,
  stock INT DEFAULT 0,
  unlimited_stock TINYINT(1) DEFAULT 1,
  description TEXT,
  image_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_brand (brand),
  INDEX idx_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Digiflazz Data Package Products
CREATE TABLE IF NOT EXISTS digiflazz_data_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_sku_code VARCHAR(100) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  custom_product_name VARCHAR(255) NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  type VARCHAR(100),
  price INT NOT NULL,
  seller_price INT,
  selling_price INT,
  is_active TINYINT(1) DEFAULT 1,
  stock INT DEFAULT 0,
  unlimited_stock TINYINT(1) DEFAULT 1,
  description TEXT,
  image_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_brand (brand),
  INDEX idx_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Digiflazz Pulsa & Data Transactions
CREATE TABLE IF NOT EXISTS digiflazz_telco_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(255),
  brand VARCHAR(100),
  category VARCHAR(100),
  product_type ENUM('pulsa','data') NOT NULL,
  customer_no VARCHAR(100) NOT NULL,
  ref_id VARCHAR(100) UNIQUE NOT NULL,
  digiflazz_status ENUM('Pending', 'Sukses', 'Gagal') DEFAULT 'Pending',
  price INT NOT NULL,
  selling_price INT NOT NULL,
  sn VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_ref (ref_id),
  INDEX idx_status (digiflazz_status),
  INDEX idx_product_type (product_type)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_topup_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(255),
  customer_no VARCHAR(100) NOT NULL,
  ref_id VARCHAR(100) UNIQUE NOT NULL,
  digiflazz_status ENUM('Pending', 'Sukses', 'Gagal') DEFAULT 'Pending',
  price INT NOT NULL,
  selling_price INT NOT NULL,
  sn VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_ref (ref_id),
  INDEX idx_status (digiflazz_status)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_brand_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(100) UNIQUE NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_brand_name (brand_name)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_topup_banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(255) NOT NULL,
  brand_name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_name) REFERENCES game_brand_images(brand_name) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_active_banners (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Other Products (Capcut, Canva, etc.) Tables
CREATE TABLE IF NOT EXISTS other_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price INT NOT NULL,
  image_url VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_other_products_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS other_product_stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  stock_data_email VARCHAR(255) NULL,
  stock_data_password VARCHAR(255) NULL,
  stock_data_link TEXT NULL,
  masa_aktif VARCHAR(255) NULL,
  status ENUM('tersedia', 'terjual') NOT NULL DEFAULT 'tersedia',
  sold_at DATETIME NULL,
  user_id_buyer INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES other_products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id_buyer) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_other_product_stock_status (status)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS other_product_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  product_id INT,
  stock_id INT NOT NULL UNIQUE,
  product_name_snapshot VARCHAR(255) NOT NULL,
  price_at_purchase INT NOT NULL,
  stock_data_email VARCHAR(255) NULL,
  stock_data_password VARCHAR(255) NULL,
  stock_data_link TEXT NULL,
  masa_aktif VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES other_products(id) ON DELETE SET NULL,
  INDEX idx_other_product_transactions_user (user_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS other_product_banners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  image_url VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES other_products(id) ON DELETE CASCADE,
  INDEX idx_other_product_banners_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Auto Sync Settings for Digiflazz
CREATE TABLE IF NOT EXISTS auto_sync_digiflazz (
  id INT PRIMARY KEY AUTO_INCREMENT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  interval_minutes INT NOT NULL DEFAULT 60,
  last_sync_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default auto-sync settings
INSERT INTO auto_sync_digiflazz (id, is_active, interval_minutes) VALUES (1, 1, 60)
ON DUPLICATE KEY UPDATE is_active=VALUES(is_active), interval_minutes=VALUES(interval_minutes);

-- System Settings Table (for dynamic configuration like Payment Gateway)
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES ('active_payment_gateway', 'TRIPAY');
