-- ============================================================================
-- Migration: Allow TBD match entries
-- Version: 1.1.4
-- Purpose:
--   - Knockout schedule placeholders can be created before both entries are known.
--   - Match entries are filled later from knockout_brackets.
-- ============================================================================

ALTER TABLE `matches`
  MODIFY `entryAId` INT UNSIGNED NULL,
  MODIFY `entryBId` INT UNSIGNED NULL;
