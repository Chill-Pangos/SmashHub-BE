-- ============================================================================
-- Migration: Remove rejected from matches.resultStatus
-- Version: 1.1.6
-- Purpose:
--   - Match result approval now supports only pending and approved.
--   - Existing rejected match results are moved back to pending for re-review.
-- ============================================================================

UPDATE `matches`
SET `resultStatus` = 'pending'
WHERE `resultStatus` = 'rejected';

ALTER TABLE `matches`
  MODIFY `resultStatus` ENUM('pending', 'approved') NULL
  COMMENT 'Status of match result approval by chief referee';
