-- SmashHub Database Initialization Script
-- Created: 2026-03-20

-- =============================================
-- USER MANAGEMENT TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `firstName` VARCHAR(50) NOT NULL,
  `lastName` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `isEmailVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  `gender` ENUM('male', 'female', 'other') DEFAULT NULL,
  `avatarUrl` VARCHAR(255) DEFAULT NULL,
  `dob` DATETIME DEFAULT NULL,
  `phoneNumber` VARCHAR(20) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dob` (`dob`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `roleId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_roleId` (`roleId`),
  KEY `idx_userId_roleId` (`userId`, `roleId`),
  CONSTRAINT `fk_user_roles_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_roles_roleId` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `roleId` INT UNSIGNED NOT NULL,
  `permissionId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_permissionId` (`permissionId`),
  KEY `idx_roleId_permissionId` (`roleId`, `permissionId`),
  CONSTRAINT `fk_role_permissions_roleId` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_permissionId` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `access_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `token` TEXT NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `isBlacklisted` BOOLEAN NOT NULL DEFAULT FALSE,
  `blacklistedAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_expiresAt` (`expiresAt`),
  KEY `idx_isBlacklisted_expiresAt` (`isBlacklisted`, `expiresAt`),
  CONSTRAINT `fk_access_tokens_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `token` TEXT NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `isBlacklisted` BOOLEAN NOT NULL DEFAULT FALSE,
  `blacklistedAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_expiresAt` (`expiresAt`),
  KEY `idx_isBlacklisted_expiresAt` (`isBlacklisted`, `expiresAt`),
  CONSTRAINT `fk_refresh_tokens_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `otps` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `code` VARCHAR(6) NOT NULL,
  `type` ENUM('password_reset', 'email_verification') NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `isUsed` BOOLEAN NOT NULL DEFAULT FALSE,
  `usedAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expiresAt` (`expiresAt`),
  KEY `idx_userId_type_isUsed` (`userId`, `type`, `isUsed`),
  CONSTRAINT `fk_otps_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `elo_scores` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `score` INT NOT NULL DEFAULT 1000,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_userId` (`userId`),
  CONSTRAINT `fk_elo_scores_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `elo_histories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `matchId` INT UNSIGNED NOT NULL,
  `userId` INT UNSIGNED NOT NULL,
  `previousElo` INT NOT NULL,
  `newElo` INT NOT NULL,
  `changeReason` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_matchId` (`matchId`),
  KEY `idx_userId_createdAt` (`userId`, `createdAt`),
  CONSTRAINT `fk_elo_histories_matchId` FOREIGN KEY (`matchId`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_elo_histories_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TOURNAMENT TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS `tournaments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `status` ENUM('upcoming', 'ongoing', 'completed') NOT NULL DEFAULT 'upcoming',
  `tier` INT UNSIGNED NOT NULL,
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME DEFAULT NULL,
  `location` VARCHAR(100) NOT NULL,
  `createdBy` INT UNSIGNED NOT NULL,
  `numberOfTables` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_createdBy` (`createdBy`),
  KEY `idx_startDate` (`startDate`),
  KEY `idx_tier` (`tier`),
  KEY `idx_status_startDate` (`status`, `startDate`),
  CONSTRAINT `fk_tournaments_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tournament_category` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tournamentId` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('single', 'team', 'double') NOT NULL,
  `maxEntries` INT UNSIGNED NOT NULL,
  `maxSets` INT UNSIGNED NOT NULL,
  `numberOfSingles` INT UNSIGNED DEFAULT NULL,
  `numberOfDoubles` INT UNSIGNED DEFAULT NULL,
  `minAge` INT UNSIGNED DEFAULT NULL,
  `maxAge` INT UNSIGNED DEFAULT NULL,
  `minElo` INT UNSIGNED DEFAULT NULL,
  `maxElo` INT UNSIGNED DEFAULT NULL,
  `gender` ENUM('male', 'female', 'mixed') DEFAULT NULL,
  `isGroupStage` BOOLEAN DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_gender` (`gender`),
  KEY `idx_isGroupStage` (`isGroupStage`),
  KEY `idx_tournamentId_type` (`tournamentId`, `type`),
  CONSTRAINT `fk_tournament_category_tournamentId` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tournament_referees` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tournamentId` INT UNSIGNED NOT NULL,
  `refereeId` INT UNSIGNED NOT NULL,
  `role` ENUM('main', 'assistant') NOT NULL DEFAULT 'assistant',
  `isAvailable` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_refereeId` (`refereeId`),
  KEY `idx_tournamentId_role_isAvailable` (`tournamentId`, `role`, `isAvailable`),
  CONSTRAINT `fk_tournament_referees_tournamentId` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tournament_referees_refereeId` FOREIGN KEY (`refereeId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TEAM TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS `teams` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tournamentId` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tournamentId_name` (`tournamentId`, `name`),
  CONSTRAINT `fk_teams_tournamentId` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `team_members` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `teamId` INT UNSIGNED NOT NULL,
  `userId` INT UNSIGNED NOT NULL,
  `role` ENUM('member', 'captain') NOT NULL DEFAULT 'member',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_teamId_userId` (`teamId`, `userId`),
  KEY `idx_teamId_role` (`teamId`, `role`),
  CONSTRAINT `fk_team_members_teamId` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_team_members_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- ENTRY TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS `entries` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `categoryId` INT UNSIGNED NOT NULL,
  `teamId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categoryId` (`categoryId`),
  KEY `idx_teamId` (`teamId`),
  CONSTRAINT `fk_entries_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `tournament_category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_entries_teamId` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `entry_members` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entryId` INT UNSIGNED NOT NULL,
  `userId` INT UNSIGNED NOT NULL,
  `eloAtEntry` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_entryId_userId` (`entryId`, `userId`),
  CONSTRAINT `fk_entry_members_entryId` FOREIGN KEY (`entryId`) REFERENCES `entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_entry_members_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `group_standings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `categoryId` INT UNSIGNED NOT NULL,
  `groupName` VARCHAR(50) NOT NULL,
  `entryId` INT UNSIGNED NOT NULL,
  `matchesPlayed` INT UNSIGNED NOT NULL DEFAULT 0,
  `matchesWon` INT UNSIGNED NOT NULL DEFAULT 0,
  `matchesLost` INT UNSIGNED NOT NULL DEFAULT 0,
  `setsWon` INT UNSIGNED NOT NULL DEFAULT 0,
  `setsLost` INT UNSIGNED NOT NULL DEFAULT 0,
  `setsDiff` INT NOT NULL DEFAULT 0,
  `position` INT UNSIGNED DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entryId` (`entryId`),
  KEY `idx_categoryId_groupName` (`categoryId`, `groupName`),
  KEY `idx_categoryId_position` (`categoryId`, `position`),
  CONSTRAINT `fk_group_standings_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `tournament_category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_group_standings_entryId` FOREIGN KEY (`entryId`) REFERENCES `entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SCHEDULE & MATCH TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS `schedules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `categoryId` INT UNSIGNED NOT NULL,
  `roundNumber` INT UNSIGNED DEFAULT NULL,
  `groupName` VARCHAR(50) DEFAULT NULL,
  `stage` ENUM('group', 'knockout') DEFAULT 'group',
  `knockoutRound` VARCHAR(50) DEFAULT NULL,
  `tableNumber` INT DEFAULT NULL,
  `scheduledAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_scheduledAt` (`scheduledAt`),
  KEY `idx_stage` (`stage`),
  KEY `idx_categoryId_stage` (`categoryId`, `stage`),
  KEY `idx_categoryId_groupName` (`categoryId`, `groupName`),
  KEY `idx_categoryId_roundNumber` (`categoryId`, `roundNumber`),
  CONSTRAINT `fk_schedules_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `tournament_category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `matches` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scheduleId` INT UNSIGNED NOT NULL,
  `entryAId` INT UNSIGNED NOT NULL,
  `entryBId` INT UNSIGNED NOT NULL,
  `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL,
  `winnerEntryId` INT UNSIGNED DEFAULT NULL,
  `umpire` INT UNSIGNED DEFAULT NULL,
  `assistantUmpire` INT UNSIGNED DEFAULT NULL,
  `resultStatus` ENUM('pending', 'approved', 'rejected') DEFAULT NULL,
  `reviewNotes` TEXT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entryAId` (`entryAId`),
  KEY `idx_entryBId` (`entryBId`),
  KEY `idx_winnerEntryId` (`winnerEntryId`),
  KEY `idx_umpire` (`umpire`),
  KEY `idx_assistantUmpire` (`assistantUmpire`),
  KEY `idx_status` (`status`),
  KEY `idx_resultStatus` (`resultStatus`),
  KEY `idx_scheduleId_status` (`scheduleId`, `status`),
  CONSTRAINT `fk_matches_scheduleId` FOREIGN KEY (`scheduleId`) REFERENCES `schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_entryAId` FOREIGN KEY (`entryAId`) REFERENCES `entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_entryBId` FOREIGN KEY (`entryBId`) REFERENCES `entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_winnerEntryId` FOREIGN KEY (`winnerEntryId`) REFERENCES `entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_umpire` FOREIGN KEY (`umpire`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_assistantUmpire` FOREIGN KEY (`assistantUmpire`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `knockout_brackets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `categoryId` INT UNSIGNED NOT NULL,
  `roundNumber` INT UNSIGNED NOT NULL,
  `bracketPosition` INT UNSIGNED NOT NULL,
  `scheduleId` INT UNSIGNED DEFAULT NULL,
  `matchId` INT UNSIGNED DEFAULT NULL,
  `entryAId` INT UNSIGNED DEFAULT NULL,
  `entryBId` INT UNSIGNED DEFAULT NULL,
  `winnerEntryId` INT UNSIGNED DEFAULT NULL,
  `nextBracketId` INT UNSIGNED DEFAULT NULL,
  `previousBracketAId` INT UNSIGNED DEFAULT NULL,
  `previousBracketBId` INT UNSIGNED DEFAULT NULL,
  `status` ENUM('pending', 'ready', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  `roundName` VARCHAR(50) DEFAULT NULL,
  `isByeMatch` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_scheduleId` (`scheduleId`),
  KEY `idx_matchId` (`matchId`),
  KEY `idx_entryAId` (`entryAId`),
  KEY `idx_entryBId` (`entryBId`),
  KEY `idx_winnerEntryId` (`winnerEntryId`),
  KEY `idx_nextBracketId` (`nextBracketId`),
  KEY `idx_previousBracketAId` (`previousBracketAId`),
  KEY `idx_previousBracketBId` (`previousBracketBId`),
  KEY `idx_categoryId_roundNumber_bracketPosition` (`categoryId`, `roundNumber`, `bracketPosition`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_knockout_brackets_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `tournament_category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_scheduleId` FOREIGN KEY (`scheduleId`) REFERENCES `schedules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_matchId` FOREIGN KEY (`matchId`) REFERENCES `matches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_entryAId` FOREIGN KEY (`entryAId`) REFERENCES `entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_entryBId` FOREIGN KEY (`entryBId`) REFERENCES `entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_winnerEntryId` FOREIGN KEY (`winnerEntryId`) REFERENCES `entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_nextBracketId` FOREIGN KEY (`nextBracketId`) REFERENCES `knockout_brackets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_previousBracketAId` FOREIGN KEY (`previousBracketAId`) REFERENCES `knockout_brackets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_previousBracketBId` FOREIGN KEY (`previousBracketBId`) REFERENCES `knockout_brackets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SUB-MATCH TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS `sub_matches` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `matchId` INT UNSIGNED NOT NULL,
  `subMatchNumber` INT UNSIGNED NOT NULL,
  `status` ENUM('in_progress', 'completed') NOT NULL,
  `winnerTeam` ENUM('A', 'B') DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_matchId_subMatchNumber` (`matchId`, `subMatchNumber`),
  CONSTRAINT `fk_sub_matches_matchId` FOREIGN KEY (`matchId`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `match_sets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `subMatchId` INT UNSIGNED NOT NULL,
  `setNumber` INT UNSIGNED NOT NULL,
  `entryAScore` INT UNSIGNED NOT NULL DEFAULT 0,
  `entryBScore` INT UNSIGNED NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_subMatchId_setNumber` (`subMatchId`, `setNumber`),
  CONSTRAINT `fk_match_sets_subMatchId` FOREIGN KEY (`subMatchId`) REFERENCES `sub_matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sub_match_players` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `subMatchId` INT UNSIGNED NOT NULL,
  `entryMemberId` INT UNSIGNED NOT NULL,
  `team` ENUM('A', 'B') NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entryMemberId` (`entryMemberId`),
  KEY `idx_subMatchId_team` (`subMatchId`, `team`),
  CONSTRAINT `fk_sub_match_players_subMatchId` FOREIGN KEY (`subMatchId`) REFERENCES `sub_matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_match_players_entryMemberId` FOREIGN KEY (`entryMemberId`) REFERENCES `entry_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
