-- SQL Script to add missing columns to the database
-- Run this on your PostgreSQL database

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_date TIMESTAMP;

-- Email verification columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP;

-- IMPORTANT: Update existing NULL values to false (fix for existing users)
UPDATE users SET email_verified = false WHERE email_verified IS NULL;
UPDATE users SET is_deleted = false WHERE is_deleted IS NULL;

-- Set existing users as verified (optional - remove if you want existing users to verify)
-- UPDATE users SET email_verified = true WHERE email_verified = false;

-- Add columns to url_mapping table (if missing)
ALTER TABLE url_mapping ADD COLUMN IF NOT EXISTS is_one_time_url BOOLEAN DEFAULT false;
ALTER TABLE url_mapping ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT false;
ALTER TABLE url_mapping ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE url_mapping ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create device_access table if not exists
CREATE TABLE IF NOT EXISTS device_access (
    id BIGSERIAL PRIMARY KEY,
    device_fingerprint VARCHAR(255),
    accessed_at TIMESTAMP,
    url_mapping_id BIGINT REFERENCES url_mapping(id) ON DELETE CASCADE
);

-- Verify the changes
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'url_mapping';

