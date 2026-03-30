-- ============================================================================
-- SmashHub Database Schema
-- Version: 1.0.0
-- Generated based on Sequelize models
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS & AUTHENTICATION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `firstName` VARCHAR(50) NOT NULL,
  `lastName` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `isEmailVerified` TINYINT(1) NOT NULL DEFAULT 0,
  `gender` ENUM('male', 'female') NULL,
  `avatarUrl` VARCHAR(255) NULL,
  `dob` DATE NULL,
  `phoneNumber` VARCHAR(20) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  INDEX `users_dob_idx` (`dob`),
  INDEX `users_email_idx` (`email`),
  INDEX `users_phone_idx` (`phoneNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(500) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `roleId` INT UNSIGNED NOT NULL,
  `permissionId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`roleId`, `permissionId`),
  INDEX `role_permissions_permission_idx` (`permissionId`),
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `userId` INT UNSIGNED NOT NULL,
  `roleId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`, `roleId`),
  INDEX `user_roles_role_idx` (`roleId`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tokens` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `type` ENUM('access', 'refresh') NOT NULL,
  `token` TEXT NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `isBlacklisted` TINYINT(1) NOT NULL DEFAULT 0,
  `blacklistedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `tokens_user_idx` (`userId`),
  INDEX `tokens_expires_idx` (`expiresAt`),
  INDEX `tokens_type_idx` (`type`),
  INDEX `tokens_user_type_idx` (`userId`, `type`),
  INDEX `tokens_blacklist_expires_idx` (`isBlacklisted`, `expiresAt`),
  UNIQUE KEY `tokens_token_unique` (`token`(255)),
  CONSTRAINT `fk_tokens_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `otps` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `code` VARCHAR(6) NOT NULL,
  `type` ENUM('password_reset', 'email_verification') NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `isUsed` TINYINT(1) NOT NULL DEFAULT 0,
  `usedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `otps_expires_idx` (`expiresAt`),
  INDEX `otps_user_type_used_idx` (`userId`, `type`, `isUsed`),
  CONSTRAINT `fk_otps_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- ELO SYSTEM
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `elo_scores` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `score` INT NOT NULL DEFAULT 1000,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `elo_scores_user_unique` (`userId`),
  CONSTRAINT `fk_elo_scores_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- TOURNAMENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `tournaments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `tier` INT UNSIGNED NOT NULL,
  `status` ENUM('upcoming', 'registration_open', 'registration_closed', 'brackets_generated', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming',
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME NOT NULL,
  `registrationStartDate` DATETIME NOT NULL,
  `registrationEndDate` DATETIME NOT NULL,
  `bracketGenerationDate` DATETIME NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `createdBy` INT UNSIGNED NOT NULL,
  `numberOfTables` INT UNSIGNED NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tournaments_name_unique` (`name`),
  INDEX `tournaments_created_by_idx` (`createdBy`),
  INDEX `tournaments_start_date_idx` (`startDate`),
  INDEX `tournaments_tier_idx` (`tier`),
  INDEX `tournaments_status_start_idx` (`status`, `startDate`),
  INDEX `tournaments_reg_start_idx` (`registrationStartDate`),
  INDEX `tournaments_reg_end_idx` (`registrationEndDate`),
  INDEX `tournaments_bracket_gen_idx` (`bracketGenerationDate`),
  INDEX `tournaments_status_reg_bracket_idx` (`status`, `registrationEndDate`, `bracketGenerationDate`),
  CONSTRAINT `fk_tournaments_creator` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tournament_categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tournamentId` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('single', 'double', 'team') NOT NULL,
  `maxEntries` INT UNSIGNED NOT NULL,
  `maxSets` INT UNSIGNED NOT NULL,
  `teamFormat` VARCHAR(50) NULL,
  `minAge` INT UNSIGNED NULL,
  `maxAge` INT UNSIGNED NULL,
  `minElo` INT UNSIGNED NULL,
  `maxElo` INT UNSIGNED NULL,
  `maxMembersPerEntry` INT UNSIGNED NULL COMMENT 'Only applicable for team type. Null = no upper limit',
  `gender` ENUM('male', 'female', 'mixed') NULL,
  `isGroupStage` TINYINT(1) NOT NULL DEFAULT 0,
  `entryFee` DECIMAL(10, 2) NULL DEFAULT 0 COMMENT 'Entry fee for this category. 0 or null = free',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `tournament_categories_type_idx` (`type`),
  INDEX `tournament_categories_gender_idx` (`gender`),
  INDEX `tournament_categories_group_stage_idx` (`isGroupStage`),
  INDEX `tournament_categories_tournament_type_idx` (`tournamentId`, `type`),
  CONSTRAINT `fk_tournament_categories_tournament` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tournament_referees` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tournamentId` INT UNSIGNED NOT NULL,
  `refereeId` INT UNSIGNED NOT NULL,
  `role` ENUM('main', 'assistant') NOT NULL DEFAULT 'assistant',
  `isAvailable` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `tournament_referees_tournament_idx` (`tournamentId`),
  INDEX `tournament_referees_referee_idx` (`refereeId`),
  INDEX `tournament_referees_tournament_role_avail_idx` (`tournamentId`, `role`, `isAvailable`),
  UNIQUE KEY `tournament_referees_tournament_referee_unique` (`tournamentId`, `refereeId`),
  CONSTRAINT `fk_tournament_referees_tournament` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tournament_referees_referee` FOREIGN KEY (`refereeId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- ENTRIES & MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `entries` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `categoryId` INT UNSIGNED NOT NULL,
  `captainId` INT UNSIGNED NULL,
  `name` VARCHAR(100) NOT NULL,
  `isAcceptingMembers` TINYINT(1) NOT NULL DEFAULT 0,
  `requiredMemberCount` INT UNSIGNED NULL,
  `currentMemberCount` INT UNSIGNED NOT NULL DEFAULT 0,
  `isConfirmed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Captain has confirmed the final lineup',
  `confirmedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `entries_category_idx` (`categoryId`),
  INDEX `entries_captain_idx` (`captainId`),
  INDEX `entries_accepting_idx` (`isAcceptingMembers`),
  CONSTRAINT `fk_entries_category` FOREIGN KEY (`categoryId`) REFERENCES `tournament_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_entries_captain` FOREIGN KEY (`captainId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `join_requests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entryId` INT UNSIGNED NOT NULL,
  `userId` INT UNSIGNED NOT NULL COMMENT 'User requesting to join',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `rejectionReason` VARCHAR(255) NULL COMMENT 'Optional reason when captain rejects',
  `respondedAt` DATETIME NULL COMMENT 'When captain approved or rejected',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `join_requests_entry_idx` (`entryId`),
  INDEX `join_requests_user_idx` (`userId`),
  INDEX `join_requests_status_idx` (`status`),
  INDEX `join_requests_entry_status_idx` (`entryId`, `status`),
  UNIQUE KEY `join_requests_entry_user_unique` (`entryId`, `userId`),
  CONSTRAINT `fk_join_requests_entry` FOREIGN KEY (`entryId`) REFERENCES `entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_join_requests_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `entry_members` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entryId` INT UNSIGNED NOT NULL,
  `userId` INT UNSIGNED NOT NULL,
  `eloAtEntry` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `entry_members_user_idx` (`userId`),
  INDEX `entry_members_entry_idx` (`entryId`),
  UNIQUE KEY `entry_members_entry_user_unique` (`entryId`, `userId`),
  CONSTRAINT `fk_entry_members_entry` FOREIGN KEY (`entryId`) REFERENCES `entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_entry_members_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entryId` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `method` ENUM('cash', 'bank_transfer', 'online') NOT NULL,
  `status` ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `proofImageUrl` VARCHAR(500) NULL COMMENT 'Required for bank_transfer method',
  `confirmedBy` INT UNSIGNED NULL COMMENT 'Tournament organizer who confirmed the payment',
  `confirmedAt` DATETIME NULL,
  `transactionRef` VARCHAR(100) NULL COMMENT 'Transaction reference for online payments (Stripe/VNPay)',
  `refundedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `payments_entry_idx` (`entryId`),
  INDEX `payments_status_idx` (`status`),
  INDEX `payments_method_idx` (`method`),
  INDEX `payments_confirmed_by_idx` (`confirmedBy`),
  INDEX `payments_entry_status_idx` (`entryId`, `status`),
  CONSTRAINT `fk_payments_entry` FOREIGN KEY (`entryId`) REFERENCES `entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_confirmed_by` FOREIGN KEY (`confirmedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- SCHEDULES & MATCHES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `schedules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `categoryId` INT UNSIGNED NOT NULL,
  `scheduledAt` DATETIME NOT NULL,
  `stage` ENUM('group', 'knockout') NOT NULL DEFAULT 'group',
  `groupName` VARCHAR(50) NULL,
  `knockoutRound` ENUM('Round of 64', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third-place', 'Final') NULL,
  `tableNumber` INT UNSIGNED NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `schedules_scheduled_at_idx` (`scheduledAt`),
  INDEX `schedules_stage_idx` (`stage`),
  INDEX `schedules_category_stage_idx` (`categoryId`, `stage`),
  INDEX `schedules_category_group_idx` (`categoryId`, `groupName`),
  INDEX `schedules_category_knockout_idx` (`categoryId`, `knockoutRound`),
  CONSTRAINT `fk_schedules_category` FOREIGN KEY (`categoryId`) REFERENCES `tournament_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `matches` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scheduleId` INT UNSIGNED NOT NULL,
  `entryAId` INT UNSIGNED NOT NULL,
  `entryBId` INT UNSIGNED NOT NULL,
  `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  `winnerEntryId` INT UNSIGNED NULL,
  `resultStatus` ENUM('pending', 'approved', 'rejected') NULL COMMENT 'Status of match result approval by chief referee',
  `reviewNotes` TEXT NULL COMMENT 'Review notes from chief referee',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `matches_entry_a_idx` (`entryAId`),
  INDEX `matches_entry_b_idx` (`entryBId`),
  INDEX `matches_winner_idx` (`winnerEntryId`),
  INDEX `matches_status_idx` (`status`),
  INDEX `matches_result_status_idx` (`resultStatus`),
  INDEX `matches_schedule_status_idx` (`scheduleId`, `status`),
  CONSTRAINT `fk_matches_schedule` FOREIGN KEY (`scheduleId`) REFERENCES `schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_entry_a` FOREIGN KEY (`entryAId`) REFERENCES `entries` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_entry_b` FOREIGN KEY (`entryBId`) REFERENCES `entries` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_winner` FOREIGN KEY (`winnerEntryId`) REFERENCES `entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `match_referees` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `matchId` INT UNSIGNED NOT NULL,
  `refereeId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `match_referees_match_idx` (`matchId`),
  INDEX `match_referees_referee_idx` (`refereeId`),
  UNIQUE KEY `match_referees_match_referee_unique` (`matchId`, `refereeId`),
  CONSTRAINT `fk_match_referees_match` FOREIGN KEY (`matchId`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_match_referees_referee` FOREIGN KEY (`refereeId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sub_matches` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `matchId` INT UNSIGNED NOT NULL,
  `subMatchNumber` INT UNSIGNED NOT NULL,
  `status` ENUM('scheduled', 'in_progress', 'completed') NOT NULL DEFAULT 'scheduled',
  `winnerTeam` ENUM('A', 'B') NULL,
  `umpireId` INT UNSIGNED NULL COMMENT 'Decided by referees before sub-match starts',
  `assistantUmpireId` INT UNSIGNED NULL COMMENT 'Optional — null if only 1 referee assigned to this match',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `sub_matches_status_idx` (`status`),
  INDEX `sub_matches_umpire_idx` (`umpireId`),
  INDEX `sub_matches_match_status_idx` (`matchId`, `status`),
  UNIQUE KEY `sub_matches_match_number_unique` (`matchId`, `subMatchNumber`),
  CONSTRAINT `fk_sub_matches_match` FOREIGN KEY (`matchId`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_matches_umpire` FOREIGN KEY (`umpireId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_matches_assistant_umpire` FOREIGN KEY (`assistantUmpireId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
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
  UNIQUE KEY `match_sets_submatch_set_unique` (`subMatchId`, `setNumber`),
  CONSTRAINT `fk_match_sets_submatch` FOREIGN KEY (`subMatchId`) REFERENCES `sub_matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sub_match_players` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `subMatchId` INT UNSIGNED NOT NULL,
  `entryMemberId` INT UNSIGNED NOT NULL,
  `team` ENUM('A', 'B') NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `sub_match_players_submatch_idx` (`subMatchId`),
  INDEX `sub_match_players_member_idx` (`entryMemberId`),
  INDEX `sub_match_players_submatch_team_idx` (`subMatchId`, `team`),
  UNIQUE KEY `sub_match_players_submatch_member_unique` (`subMatchId`, `entryMemberId`),
  CONSTRAINT `fk_sub_match_players_submatch` FOREIGN KEY (`subMatchId`) REFERENCES `sub_matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_match_players_member` FOREIGN KEY (`entryMemberId`) REFERENCES `entry_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- ELO HISTORY
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `elo_histories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `matchId` INT UNSIGNED NOT NULL,
  `userId` INT UNSIGNED NOT NULL,
  `previousElo` INT NOT NULL,
  `newElo` INT NOT NULL,
  `eloDelta` INT NOT NULL COMMENT 'newElo - previousElo',
  `changeReason` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `elo_histories_match_idx` (`matchId`),
  INDEX `elo_histories_user_created_idx` (`userId`, `createdAt`),
  CONSTRAINT `fk_elo_histories_match` FOREIGN KEY (`matchId`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_elo_histories_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- GROUP STANDINGS
-- ─────────────────────────────────────────────────────────────────────────────

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
  `setsDiff` INT NOT NULL DEFAULT 0 COMMENT 'setsWon - setsLost',
  `position` INT UNSIGNED NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `group_standings_entry_idx` (`entryId`),
  INDEX `group_standings_category_group_idx` (`categoryId`, `groupName`),
  INDEX `group_standings_category_position_idx` (`categoryId`, `position`),
  UNIQUE KEY `group_standings_category_group_entry_unique` (`categoryId`, `groupName`, `entryId`),
  CONSTRAINT `fk_group_standings_category` FOREIGN KEY (`categoryId`) REFERENCES `tournament_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_group_standings_entry` FOREIGN KEY (`entryId`) REFERENCES `entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- KNOCKOUT BRACKETS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `knockout_brackets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `categoryId` INT UNSIGNED NOT NULL,
  `roundNumber` INT UNSIGNED NOT NULL COMMENT '1=R64, 2=R32, 3=R16, 4=QF, 5=SF, 6=Final',
  `bracketPosition` INT UNSIGNED NOT NULL COMMENT '0-based position within the round',
  `roundName` ENUM('Round of 64', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third-place', 'Final') NOT NULL COMMENT 'Human-readable round name',
  `scheduleId` INT UNSIGNED NULL,
  `matchId` INT UNSIGNED NULL,
  `entryAId` INT UNSIGNED NULL,
  `entryBId` INT UNSIGNED NULL,
  `winnerEntryId` INT UNSIGNED NULL,
  `nextBracketId` INT UNSIGNED NULL,
  `previousBracketAId` INT UNSIGNED NULL,
  `previousBracketBId` INT UNSIGNED NULL,
  `status` ENUM('pending', 'ready', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  `isByeMatch` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'True if one entry advances without playing',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `knockout_brackets_category_idx` (`categoryId`),
  INDEX `knockout_brackets_schedule_idx` (`scheduleId`),
  INDEX `knockout_brackets_match_idx` (`matchId`),
  INDEX `knockout_brackets_entry_a_idx` (`entryAId`),
  INDEX `knockout_brackets_entry_b_idx` (`entryBId`),
  INDEX `knockout_brackets_winner_idx` (`winnerEntryId`),
  INDEX `knockout_brackets_next_idx` (`nextBracketId`),
  INDEX `knockout_brackets_status_idx` (`status`),
  INDEX `knockout_brackets_category_round_pos_idx` (`categoryId`, `roundNumber`, `bracketPosition`),
  UNIQUE KEY `knockout_brackets_category_round_pos_unique` (`categoryId`, `roundNumber`, `bracketPosition`),
  CONSTRAINT `fk_knockout_brackets_category` FOREIGN KEY (`categoryId`) REFERENCES `tournament_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_schedule` FOREIGN KEY (`scheduleId`) REFERENCES `schedules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_match` FOREIGN KEY (`matchId`) REFERENCES `matches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_entry_a` FOREIGN KEY (`entryAId`) REFERENCES `entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_entry_b` FOREIGN KEY (`entryBId`) REFERENCES `entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_winner` FOREIGN KEY (`winnerEntryId`) REFERENCES `entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_next` FOREIGN KEY (`nextBracketId`) REFERENCES `knockout_brackets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_prev_a` FOREIGN KEY (`previousBracketAId`) REFERENCES `knockout_brackets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_knockout_brackets_prev_b` FOREIGN KEY (`previousBracketBId`) REFERENCES `knockout_brackets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
