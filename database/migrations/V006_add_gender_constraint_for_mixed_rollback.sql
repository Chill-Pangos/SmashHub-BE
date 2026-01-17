-- Rollback Migration: Remove gender constraint for mixed
-- Date: 2026-01-17
-- Description: Remove CHECK constraint that validates gender='mixed' only for type='double'

-- Drop the constraint
ALTER TABLE tournament_contents
DROP CONSTRAINT IF EXISTS chk_gender_mixed_only_for_double;

-- After this rollback:
-- - All types (single, team, double) can have gender='mixed' again
-- - No validation on gender/type combination
