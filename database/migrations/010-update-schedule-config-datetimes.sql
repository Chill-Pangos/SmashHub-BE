-- ============================================================================
-- Migration: Store schedule config times as datetimes
-- Version: 1.1.10
-- Purpose:
--   - Move daily start/end time into startDate/endDate.
--   - Replace lunch break hour/minute columns with datetime columns.
-- ============================================================================

ALTER TABLE `schedule_configs`
  ADD COLUMN `startLunchBreak` DATETIME NULL AFTER `breakDurationMinutes`,
  ADD COLUMN `endLunchBreak` DATETIME NULL AFTER `startLunchBreak`;

UPDATE `schedule_configs`
SET
  `startLunchBreak` = CASE
    WHEN `lunchBreakStartHour` IS NULL THEN NULL
    ELSE DATE_ADD(
      DATE_ADD(DATE(`startDate`), INTERVAL `lunchBreakStartHour` HOUR),
      INTERVAL COALESCE(`lunchBreakStartMinute`, 0) MINUTE
    )
  END,
  `endLunchBreak` = CASE
    WHEN `lunchBreakEndHour` IS NULL THEN NULL
    ELSE DATE_ADD(
      DATE_ADD(DATE(`startDate`), INTERVAL `lunchBreakEndHour` HOUR),
      INTERVAL COALESCE(`lunchBreakEndMinute`, 0) MINUTE
    )
  END,
  `startDate` = DATE_ADD(
    DATE_ADD(DATE(`startDate`), INTERVAL `dailyStartHour` HOUR),
    INTERVAL `dailyStartMinute` MINUTE
  ),
  `endDate` = DATE_ADD(
    DATE_ADD(DATE(`endDate`), INTERVAL `dailyEndHour` HOUR),
    INTERVAL `dailyEndMinute` MINUTE
  );

ALTER TABLE `schedule_configs`
  DROP COLUMN `dailyStartHour`,
  DROP COLUMN `dailyStartMinute`,
  DROP COLUMN `dailyEndHour`,
  DROP COLUMN `dailyEndMinute`,
  DROP COLUMN `lunchBreakStartHour`,
  DROP COLUMN `lunchBreakStartMinute`,
  DROP COLUMN `lunchBreakEndHour`,
  DROP COLUMN `lunchBreakEndMinute`,
  DROP COLUMN `lunchBreakDurationMinutes`;
