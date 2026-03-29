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
  ('referee', 'Tournament referee who can manage matches'),
  ('organizer', 'Tournament organizer who can create and manage tournaments');

-- ─────────────────────────────────────────────────────────────────────────────
-- PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO `permissions` (`name`) VALUES
  -- User permissions
  ('user:read'),
  ('user:create'),
  ('user:update'),
  ('user:delete'),
  
  -- Tournament permissions
  ('tournament:read'),
  ('tournament:create'),
  ('tournament:update'),
  ('tournament:delete'),
  
  -- Category permissions
  ('category:read'),
  ('category:create'),
  ('category:update'),
  ('category:delete'),
  
  -- Entry permissions
  ('entry:read'),
  ('entry:create'),
  ('entry:update'),
  ('entry:delete'),
  
  -- Match permissions
  ('match:read'),
  ('match:create'),
  ('match:update'),
  ('match:delete'),
  ('match:approve'),
  
  -- Schedule permissions
  ('schedule:read'),
  ('schedule:create'),
  ('schedule:update'),
  ('schedule:delete'),
  
  -- Referee permissions
  ('referee:read'),
  ('referee:assign'),
  ('referee:remove');

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
  'user:read',
  'user:update',
  'tournament:read',
  'category:read',
  'entry:read',
  'entry:create',
  'entry:update',
  'match:read',
  'schedule:read'
);

-- Referee permissions
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 
  (SELECT `id` FROM `roles` WHERE `name` = 'referee'),
  `id`
FROM `permissions` 
WHERE `name` IN (
  'user:read',
  'user:update',
  'tournament:read',
  'category:read',
  'entry:read',
  'match:read',
  'match:update',
  'schedule:read'
);

-- Organizer permissions
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 
  (SELECT `id` FROM `roles` WHERE `name` = 'organizer'),
  `id`
FROM `permissions` 
WHERE `name` IN (
  'user:read',
  'user:update',
  'tournament:read',
  'tournament:create',
  'tournament:update',
  'category:read',
  'category:create',
  'category:update',
  'entry:read',
  'entry:update',
  'entry:delete',
  'match:read',
  'match:create',
  'match:update',
  'match:approve',
  'schedule:read',
  'schedule:create',
  'schedule:update',
  'referee:read',
  'referee:assign',
  'referee:remove'
);
