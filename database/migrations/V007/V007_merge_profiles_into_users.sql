-- SmashHub Database Schema
-- Version: V007
-- Description: Merge profiles table into users table

-- Step 1: Add profile columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatarUrl VARCHAR(255) DEFAULT NULL AFTER isEmailVerified,
ADD COLUMN IF NOT EXISTS dob DATE DEFAULT NULL AFTER avatarUrl,
ADD COLUMN IF NOT EXISTS phoneNumber VARCHAR(20) DEFAULT NULL AFTER dob;

-- Step 2: Migrate data from profiles to users
UPDATE users u
INNER JOIN profiles p ON u.id = p.userId
SET 
    u.avatarUrl = p.avatarUrl,
    u.dob = p.dob,
    u.phoneNumber = p.phoneNumber
WHERE p.userId IS NOT NULL;

-- Step 3: Drop the profiles table
DROP TABLE IF EXISTS profiles;
