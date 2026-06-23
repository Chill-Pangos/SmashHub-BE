CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actorUserId` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `resourceType` VARCHAR(100) NULL,
  `resourceId` VARCHAR(100) NULL,
  `method` VARCHAR(10) NOT NULL,
  `path` VARCHAR(500) NOT NULL,
  `statusCode` INT UNSIGNED NULL,
  `ip` VARCHAR(100) NULL,
  `userAgent` VARCHAR(500) NULL,
  `durationMs` INT UNSIGNED NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `audit_logs_actor_created_idx` (`actorUserId`, `createdAt`),
  INDEX `audit_logs_action_created_idx` (`action`, `createdAt`),
  INDEX `audit_logs_resource_idx` (`resourceType`, `resourceId`),
  INDEX `audit_logs_status_created_idx` (`statusCode`, `createdAt`),
  CONSTRAINT `fk_audit_logs_actor` FOREIGN KEY (`actorUserId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `permissions` (`name`, `createdAt`, `updatedAt`)
VALUES ('admin_system:view', NOW(), NOW());

INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT r.`id`, p.`id`, NOW(), NOW()
FROM `roles` r
JOIN `permissions` p ON p.`name` = 'admin_system:view'
WHERE r.`name` = 'admin';
