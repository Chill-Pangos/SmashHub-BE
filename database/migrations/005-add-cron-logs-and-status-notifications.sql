CREATE TABLE IF NOT EXISTS `cron_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jobName` VARCHAR(100) NOT NULL,
  `tournamentId` INT UNSIGNED NULL,
  `level` ENUM('info', 'warn', 'error') NOT NULL DEFAULT 'info',
  `status` ENUM('success', 'failed', 'skipped') NOT NULL DEFAULT 'success',
  `message` VARCHAR(500) NOT NULL,
  `meta` JSON NULL,
  `startedAt` DATETIME NOT NULL,
  `finishedAt` DATETIME NULL,
  `durationMs` INT UNSIGNED NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `cron_logs_job_created_idx` (`jobName`, `createdAt`),
  INDEX `cron_logs_tournament_created_idx` (`tournamentId`, `createdAt`),
  INDEX `cron_logs_status_created_idx` (`status`, `createdAt`),
  CONSTRAINT `fk_cron_logs_tournament` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `notifications`
  MODIFY COLUMN `type` ENUM(
    'join_request',
    'join_request_approved',
    'join_request_rejected',
    'payment_confirmed',
    'payment_rejected',
    'payment_refunded',
    'match_scheduled',
    'match_starting_soon',
    'match_result',
    'tournament_announcement',
    'referee_invitation',
    'tournament_status_changed'
  ) NOT NULL;

ALTER TABLE `notifications`
  ADD COLUMN `data` JSON NULL AFTER `referenceType`;

INSERT IGNORE INTO `permissions` (`name`, `createdAt`, `updatedAt`)
VALUES ('cron_logs:view', NOW(), NOW());

INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.`id`, p.`id`, NOW(), NOW()
FROM `roles` r
JOIN `permissions` p ON p.`name` = 'cron_logs:view'
WHERE r.`name` = 'admin';
