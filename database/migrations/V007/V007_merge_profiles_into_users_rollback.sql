-- SmashHub Database Schema
-- Version: V007 Rollback
-- Description: Rollback merge profiles into users - recreate profiles table

-- Step 1: Recreate profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userId INT UNSIGNED NOT NULL,
    avatarUrl VARCHAR(255),
    dob DATE,
    phoneNumber VARCHAR(20),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Migrate data back from users to profiles
INSERT INTO profiles (userId, avatarUrl, dob, phoneNumber, createdAt, updatedAt)
SELECT 
    id,
    avatarUrl,
    dob,
    phoneNumber,
    createdAt,
    updatedAt
FROM users
WHERE avatarUrl IS NOT NULL OR dob IS NOT NULL OR phoneNumber IS NOT NULL;

-- Step 3: Remove profile columns from users table
ALTER TABLE users
DROP COLUMN IF EXISTS phoneNumber,
DROP COLUMN IF EXISTS dob,
DROP COLUMN IF EXISTS avatarUrl;
