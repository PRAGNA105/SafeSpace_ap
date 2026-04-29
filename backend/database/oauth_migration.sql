-- Google OAuth Integration Migration (Updated to match AuthController.php)
-- Add Google OAuth columns to users table

ALTER TABLE users
ADD COLUMN oauth_provider VARCHAR(50) DEFAULT NULL AFTER campus,
ADD COLUMN oauth_id VARCHAR(255) UNIQUE DEFAULT NULL AFTER oauth_provider,
ADD COLUMN oauth_profile_image VARCHAR(500) DEFAULT NULL AFTER oauth_id,
ADD COLUMN last_active DATETIME DEFAULT NULL AFTER is_active;

-- Create index for faster OAuth ID lookups
CREATE INDEX idx_oauth_id ON users(oauth_id);
CREATE INDEX idx_oauth_provider ON users(oauth_provider);

-- This allows both traditional email/password and OAuth users
-- oauth_id is unique to prevent duplicate Google accounts linked to different emails
-- oauth_provider can be 'google' for now

