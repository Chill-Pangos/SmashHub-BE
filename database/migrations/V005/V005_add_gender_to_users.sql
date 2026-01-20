-- V005: Add gender column to users table
-- Created: 2026-01-17

-- Add gender column to users table
ALTER TABLE `users`
ADD COLUMN `gender` ENUM('male', 'female') DEFAULT NULL AFTER `isEmailVerified`;

-- Create index on gender for faster filtering
CREATE INDEX `idx_users_gender` ON `users` (`gender`);
