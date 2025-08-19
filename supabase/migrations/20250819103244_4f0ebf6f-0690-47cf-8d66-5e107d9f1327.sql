
-- Add password reset columns to users table
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires_at TEXT;
ALTER TABLE users ADD COLUMN reset_attempts INTEGER DEFAULT 0;

-- Create index for reset_token for better performance
CREATE INDEX idx_users_reset_token ON users(reset_token);
