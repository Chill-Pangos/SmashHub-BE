-- Migration: Add gender column to tournament_contents table
-- Version: V002
-- Date: 2026-01-14
-- Description: Add gender field to tournament_contents to specify gender requirements (male, female, mixed)

-- Add gender column to tournament_contents table
ALTER TABLE tournament_contents
ADD COLUMN gender ENUM('male', 'female', 'mixed') NULL
AFTER maxElo;

