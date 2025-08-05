
-- Add balance column to users table
ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0;

-- Create balance_transactions table for tracking balance history
CREATE TABLE balance_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'debit' or 'credit'
    amount INTEGER NOT NULL, -- amount in Rupiah
    description TEXT NOT NULL,
    reference_type TEXT, -- 'account_creation', 'topup', 'refund'
    reference_id INTEGER, -- account_id for account_creation
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create pricing_config table
CREATE TABLE pricing_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_limit INTEGER UNIQUE NOT NULL,
    daily_price INTEGER NOT NULL, -- price per day in Rupiah
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert pricing data
INSERT INTO pricing_config (ip_limit, daily_price) VALUES 
(1, 330),
(2, 430),
(4, 600);

-- Create indexes for balance_transactions
CREATE INDEX idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX idx_balance_transactions_type ON balance_transactions(type);
CREATE INDEX idx_balance_transactions_created ON balance_transactions(created_at);
