
-- Add role column to users table with default value 'member'
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('member', 'reseller'));

-- Create index for better performance on role queries
CREATE INDEX idx_users_role ON users(role);
