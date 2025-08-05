
-- Add balance column to users table
ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0; -- dalam Rupiah

-- Create balance_transactions table for transaction history
CREATE TABLE balance_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'debit', 'credit', 'refund'
  amount INTEGER NOT NULL, -- dalam Rupiah
  description TEXT,
  account_id INTEGER, -- reference ke vpn_account jika terkait
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (account_id) REFERENCES vpn_account(id)
);

-- Create pricing_config table with IP limit-based pricing
CREATE TABLE pricing_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_limit INTEGER NOT NULL,
  price_per_day INTEGER NOT NULL, -- dalam Rupiah
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pricing: 1IP=330, 2IP=430, 4IP=600
INSERT INTO pricing_config (ip_limit, price_per_day) VALUES 
  (1, 330),
  (2, 430),
  (4, 600);

-- Add indexes for performance
CREATE INDEX idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX idx_balance_transactions_type ON balance_transactions(type);
CREATE INDEX idx_pricing_config_ip_limit ON pricing_config(ip_limit);
