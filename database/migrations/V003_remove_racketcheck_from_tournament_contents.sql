-- Migration: Remove racketCheck column from tournament_contents table
-- Version: V003
-- Date: 2026-01-14
-- Description: Remove racketCheck field from tournament_contents as it is no longer needed

-- Remove racketCheck column from tournament_contents table
ALTER TABLE tournament_contents
DROP COLUMN racketCheck;
