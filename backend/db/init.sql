-- MySQL compatible schema
-- Dropping tables if they exist to make the script idempotent
DROP TABLE IF EXISTS `message_reads`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `bug_hosts`;
DROP TABLE IF EXISTS `balance_transactions`;
DROP TABLE IF EXISTS `topup_transactions`;
DROP TABLE IF EXISTS `vpn_account`;
DROP TABLE IF EXISTS `pricing_config`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `Server`;
DROP TABLE IF EXISTS `android_metadata`;


CREATE TABLE `Server` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `domain` VARCHAR(255) NOT NULL,
  `auth` TEXT NOT NULL,
  `nama_server` VARCHAR(255) NOT NULL,
  `quota` INT DEFAULT 100,
  `iplimit` INT DEFAULT 2,
  `batas_create_akun` INT DEFAULT 1000,
  `total_create_akun` INT DEFAULT 0,
  `protocols` VARCHAR(255) DEFAULT 'ssh,vmess,vless,trojan',
  `location` VARCHAR(255) DEFAULT 'Unknown',
  `ping` INT DEFAULT 0,
  `status` VARCHAR(255) DEFAULT 'online'
);

CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(255) UNIQUE NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255),
  `auth_provider` VARCHAR(50) DEFAULT 'email',
  `email_verified` TINYINT(1) DEFAULT 1,
  `verification_token` VARCHAR(255),
  `verification_expires_at` TIMESTAMP NULL,
  `verification_attempts` INT DEFAULT 0,
  `reset_token` VARCHAR(255),
  `reset_token_expires_at` TIMESTAMP NULL,
  `reset_attempts` INT DEFAULT 0,
  `balance` INT DEFAULT 0,
  `is_locked` TINYINT(1) DEFAULT 0,
  `role` VARCHAR(50) DEFAULT 'member' CHECK (`role` IN ('member', 'reseller')),
  `created_vpn` INT DEFAULT 0,
  `total_transaksi` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `admins` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(255) UNIQUE NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `vpn_account` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255),
  `protocol` VARCHAR(50) NOT NULL,
  `server_id` INT NOT NULL,
  `user_id` INT,
  `duration` INT DEFAULT 1,
  `quota` INT DEFAULT 0,
  `ip_limit` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expired_date` TIMESTAMP NULL,
  `ssh_ws_port` VARCHAR(10) DEFAULT '80',
  `ssh_ssl_port` VARCHAR(10) DEFAULT '443',
  `uuid` VARCHAR(255),
  `ns_domain` VARCHAR(255),
  `vmess_tls_link` TEXT,
  `vmess_nontls_link` TEXT,
  `vmess_grpc_link` TEXT,
  `vless_tls_link` TEXT,
  `vless_nontls_link` TEXT,
  `vless_grpc_link` TEXT,
  `trojan_tls_link` TEXT,
  `trojan_nontls_link1` TEXT,
  `trojan_grpc_link` TEXT,
  FOREIGN KEY (`server_id`) REFERENCES `Server`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE `balance_transactions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `amount` INT NOT NULL,
  `description` TEXT NOT NULL,
  `reference_type` VARCHAR(255),
  `reference_id` INT,
  `balance_before` INT NOT NULL,
  `balance_after` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE `pricing_config` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ip_limit` INT UNIQUE NOT NULL,
  `daily_price` INT NOT NULL,
  `description` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `topup_transactions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `amount` INT NOT NULL,
  `amount_gross` INT,
  `duitku_reference` VARCHAR(255) UNIQUE NOT NULL,
  `duitku_merchant_order_id` VARCHAR(255) UNIQUE NOT NULL,
  `payment_method` VARCHAR(50),
  `status` VARCHAR(50) DEFAULT 'pending',
  `callback_url` TEXT,
  `return_url` TEXT,
  `payment_url` TEXT,
  `qr_code_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE `android_metadata` (`locale` TEXT);

CREATE TABLE `messages` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `target_role` VARCHAR(50) NOT NULL CHECK (`target_role` IN ('all', 'member', 'reseller')),
    `duration_days` INT,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_by_admin_id` INT NOT NULL,
    FOREIGN KEY (`created_by_admin_id`) REFERENCES `admins`(`id`)
);

CREATE TABLE `message_reads` (
    `message_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`message_id`, `user_id`),
    FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `bug_hosts` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `label` VARCHAR(255) NOT NULL,
    `value` VARCHAR(255) NOT NULL,
    `is_wildcard` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `server_pricing` (
  `server_id` INT PRIMARY KEY,
  `member_1ip` INT DEFAULT 330,
  `member_2ip` INT DEFAULT 430,
  `member_4ip` INT DEFAULT 600,
  `reseller_1ip` INT DEFAULT 165,
  `reseller_2ip` INT DEFAULT 215,
  `reseller_4ip` INT DEFAULT 300,
  FOREIGN KEY (`server_id`) REFERENCES `Server`(`id`) ON DELETE CASCADE
);


-- Insert the new pricing structure
INSERT INTO `pricing_config` (`ip_limit`, `daily_price`, `description`) VALUES
(1, 330, '1 IP - Satu perangkat'),
(2, 430, '2 IP - Dua perangkat'), 
(4, 600, '4 IP/STB - Empat perangkat / STB OpenWRT');

-- Create indexes for better performance
CREATE INDEX `idx_vpn_account_server` ON `vpn_account`(`server_id`);
CREATE INDEX `idx_vpn_account_protocol` ON `vpn_account`(`protocol`);
CREATE INDEX `idx_vpn_account_user` ON `vpn_account`(`user_id`);
CREATE INDEX `idx_vpn_account_expired` ON `vpn_account`(`expired_date`);
CREATE INDEX `idx_users_email` ON `users`(`email`);
CREATE INDEX `idx_users_username` ON `users`(`username`);
CREATE INDEX `idx_users_verification` ON `users`(`verification_token`);
CREATE INDEX `idx_users_locked` ON `users`(`is_locked`);
CREATE INDEX `idx_users_role` ON `users`(`role`);
CREATE INDEX `idx_users_reset_token` ON `users`(`reset_token`);
CREATE INDEX `idx_balance_transactions_user` ON `balance_transactions`(`user_id`);
CREATE INDEX `idx_balance_transactions_type` ON `balance_transactions`(`type`);
CREATE INDEX `idx_balance_transactions_reference` ON `balance_transactions`(`reference_type`, `reference_id`);
CREATE INDEX `idx_balance_transactions_created` ON `balance_transactions`(`created_at`);
CREATE INDEX `idx_pricing_config_ip_limit` ON `pricing_config`(`ip_limit`);
CREATE INDEX `idx_topup_transactions_user` ON `topup_transactions`(`user_id`);
CREATE INDEX `idx_topup_transactions_status` ON `topup_transactions`(`status`);
CREATE INDEX `idx_topup_transactions_duitku_ref` ON `topup_transactions`(`duitku_reference`);
CREATE INDEX `idx_topup_transactions_created` ON `topup_transactions`(`created_at`);
CREATE INDEX `idx_admins_email` ON `admins`(`email`);
CREATE INDEX `idx_admins_username` ON `admins`(`username`);
CREATE INDEX `idx_messages_target_role` ON `messages`(`target_role`);
CREATE INDEX `idx_messages_expires_at` ON `messages`(`expires_at`);
CREATE INDEX `idx_message_reads_user_id` ON `message_reads`(`user_id`);
CREATE INDEX `idx_bug_hosts_label` ON `bug_hosts`(`label`);
