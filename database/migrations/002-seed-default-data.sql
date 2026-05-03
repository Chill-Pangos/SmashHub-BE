-- ============================================================================
-- SmashHub Default Seed Data
-- Version: 1.0.0
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLES
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO `roles` (`name`, `description`) VALUES
  ('admin', 'System administrator with full access'),
  ('user', 'Regular user who can register for tournaments'),
  ('chief_referee', 'Chief referee who can approve and oversee match results'),
  ('referee', 'Tournament referee who can manage matches'),
  ('organizer', 'Tournament organizer who can create and manage tournaments');

-- ─────────────────────────────────────────────────────────────────────────────
-- PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO `permissions` (`name`) VALUES
  -- User permissions
  ('users:view'),
  ('users:create'),
  ('users:update'),
  ('users:delete'),

  -- Tournament permissions
  ('tournaments:view'),
  ('tournaments:create'),
  ('tournaments:update'),
  ('tournaments:delete'),
  ('tournaments:manage'),

  -- Category permissions
  ('category:view'),
  ('category:create'),
  ('category:update'),
  ('category:delete'),

  -- Entry permissions
  ('entries:view'),
  ('entries:create'),
  ('entries:update'),
  ('entries:delete'),
  ('entries:approve'),

  -- Match permissions
  ('matches:view'),
  ('matches:create'),
  ('matches:update'),
  ('matches:delete'),
  ('matches:start'),
  ('matches:report_result'),
  ('matches:approve_result'),

  -- Schedule permissions
  ('schedules:view'),
  ('schedules:create'),
  ('schedules:update'),
  ('schedules:delete'),

  -- Team permissions
  ('teams:view'),
  ('teams:create'),
  ('teams:update'),
  ('teams:delete'),
  ('teams:manage_members'),

  -- ELO permissions
  ('elo:view'),
  ('elo:manage'),

  -- Role & permission management
  ('roles:view'),
  ('roles:create'),
  ('roles:update'),
  ('roles:delete'),
  ('permissions:view'),
  ('permissions:manage'),

  -- Notification permissions
  ('notifications:view'),
  ('notifications:send'),

  -- Payment permissions
  ('payments:view'),
  ('payments:create'),
  ('payments:update'),
  ('payments:delete');

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLE PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Admin has all permissions
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 
  (SELECT `id` FROM `roles` WHERE `name` = 'admin'),
  `id`
FROM `permissions`;

-- User permissions
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 
  (SELECT `id` FROM `roles` WHERE `name` = 'user'),
  `id`
FROM `permissions` 
WHERE `name` IN (
  'users:view',
  'users:update',
  'tournaments:view',
  'category:view',
  'entries:view',
  'entries:create',
  'entries:update',
  'matches:view',
  'schedules:view',
  'elo:view',
  'notifications:view'
);

-- Referee permissions
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 
  (SELECT `id` FROM `roles` WHERE `name` = 'referee'),
  `id`
FROM `permissions` 
WHERE `name` IN (
  'users:view',
  'users:update',
  'tournaments:view',
  'category:view',
  'entries:view',
  'entries:update',
  'matches:view',
  'matches:update',
  'matches:start',
  'matches:report_result',
  'schedules:view',
  'notifications:view'
);

-- Chief referee permissions
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 
  (SELECT `id` FROM `roles` WHERE `name` = 'chief_referee'),
  `id`
FROM `permissions` 
WHERE `name` IN (
  'users:view',
  'users:update',
  'tournaments:view',
  'category:view',
  'entries:view',
  'entries:update',
  'matches:view',
  'matches:update',
  'matches:start',
  'matches:report_result',
  'matches:approve_result',
  'schedules:view',
  'notifications:view'
);

-- Organizer permissions
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 
  (SELECT `id` FROM `roles` WHERE `name` = 'organizer'),
  `id`
FROM `permissions` 
WHERE `name` IN (
  'users:view',
  'users:update',
  'tournaments:view',
  'tournaments:create',
  'tournaments:update',
  'tournaments:manage',
  'category:view',
  'category:create',
  'category:update',
  'entries:view',
  'entries:create',
  'entries:update',
  'entries:delete',
  'entries:approve',
  'matches:view',
  'matches:create',
  'matches:update',
  'matches:start',
  'matches:report_result',
  'matches:approve_result',
  'schedules:view',
  'schedules:create',
  'schedules:update',
  'teams:view',
  'teams:create',
  'teams:update',
  'teams:manage_members',
  'payments:view',
  'payments:create',
  'payments:update',
  'notifications:view',
  'notifications:send',
  'elo:view'
);
