-- ============================================================================
-- Migration: Make schedule tableNumber nullable for dynamic assignment
-- Version: 1.1.1
-- Purpose: Enable dynamic table assignment when match starts (in_progress)
--          instead of pre-assigning tables during schedule generation
-- ============================================================================

ALTER TABLE `schedules` MODIFY `tableNumber` INT UNSIGNED NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Notes:
-- - tableNumber is now nullable during schedule creation
-- - Dynamic assignment happens via assignTableForMatch() when match starts
-- - Existing schedules with assigned tables remain unchanged
-- ─────────────────────────────────────────────────────────────────────────────
