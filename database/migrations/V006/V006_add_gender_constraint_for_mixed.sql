-- Migration: Add constraint to ensure only double type can have mixed gender
-- Date: 2026-01-17
-- Description: Add CHECK constraint to tournament_contents table to validate that
--              only content with type='double' can have gender='mixed'

-- Add constraint to tournament_contents table
ALTER TABLE tournament_contents
ADD CONSTRAINT chk_gender_mixed_only_for_double
CHECK (
    gender != 'mixed' OR type = 'double'
);

-- This constraint ensures:
-- 1. If gender is 'mixed', then type MUST be 'double'
-- 2. If type is 'single' or 'team', gender cannot be 'mixed'
-- 3. Other gender values ('male', 'female', NULL) are allowed for all types

-- Test the constraint (optional, can be removed after verification)
-- The following should FAIL:
-- INSERT INTO tournament_contents (tournament_id, name, type, max_entries, max_sets, gender) 
-- VALUES (1, 'Test Single Mixed', 'single', 16, 3, 'mixed');

-- The following should SUCCEED:
-- INSERT INTO tournament_contents (tournament_id, name, type, max_entries, max_sets, gender) 
-- VALUES (1, 'Test Double Mixed', 'double', 16, 3, 'mixed');
