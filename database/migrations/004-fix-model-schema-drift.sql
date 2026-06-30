-- ============================================================================
-- Migration: Fix model/schema drift
-- Version: 1.1.2
-- Purpose:
--   - Add join request type used by JoinRequest model.
--   - Add tournament reference used by EloHistory model.
--   - Align schedule_configs defaults/nullability with ScheduleConfig model.
-- ============================================================================

ALTER TABLE `join_requests`
  ADD COLUMN `type` ENUM('requested', 'invited') NOT NULL DEFAULT 'requested'
  COMMENT 'requested = user requests to join, invited = captain invites user'
  AFTER `id`;

ALTER TABLE `elo_histories`
  ADD COLUMN `tournamentId` INT UNSIGNED NULL
  COMMENT 'Tournament this ELO change belongs to'
  AFTER `changeReason`,
  ADD INDEX `elo_histories_tournament_idx` (`tournamentId`),
  ADD CONSTRAINT `fk_elo_histories_tournament`
    FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `schedule_configs`
  MODIFY `matchDurationMinutes` INT UNSIGNED NOT NULL DEFAULT 30,
  MODIFY `lunchBreakStartMinute` INT UNSIGNED NULL DEFAULT 0,
  MODIFY `lunchBreakEndMinute` INT UNSIGNED NULL DEFAULT 0,
  MODIFY `notes` LONGTEXT NULL;
