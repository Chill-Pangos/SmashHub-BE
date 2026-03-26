-- SmashHub Database - Seed Default Data
-- Khởi tạo roles, permissions mặc định
-- Chạy sau 001-init-schema.sql

-- =============================================
-- SEED ROLES
-- =============================================

INSERT IGNORE INTO `roles` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES
(1, 'admin', 'Administrator - Full access to system', NOW(), NOW()),
(2, 'organizer', 'Tournament organizer - Can create and manage tournaments', NOW(), NOW()),
(3, 'referee', 'Referee - Can officiate matches and record results', NOW(), NOW()),
(4, 'player', 'Player - Can register and participate in tournaments', NOW(), NOW());

-- =============================================
-- SEED PERMISSIONS  
-- =============================================

INSERT IGNORE INTO `permissions` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
-- User Management
(1, 'user.list', NOW(), NOW()),
(2, 'user.view', NOW(), NOW()),
(3, 'user.create', NOW(), NOW()),
(4, 'user.update', NOW(), NOW()),
(5, 'user.delete', NOW(), NOW()),

-- Role & Permission Management
(6, 'role.list', NOW(), NOW()),
(7, 'role.create', NOW(), NOW()),
(8, 'role.update', NOW(), NOW()),
(9, 'role.delete', NOW(), NOW()),
(10, 'permission.list', NOW(), NOW()),
(11, 'permission.create', NOW(), NOW()),
(12, 'permission.update', NOW(), NOW()),
(13, 'permission.delete', NOW(), NOW()),

-- Tournament Management
(14, 'tournament.list', NOW(), NOW()),
(15, 'tournament.view', NOW(), NOW()),
(16, 'tournament.create', NOW(), NOW()),
(17, 'tournament.update', NOW(), NOW()),
(18, 'tournament.delete', NOW(), NOW()),
(19, 'tournament.manage_category', NOW(), NOW()),
(20, 'tournament.manage_referees', NOW(), NOW()),

-- Team Management
(21, 'team.list', NOW(), NOW()),
(22, 'team.view', NOW(), NOW()),
(23, 'team.create', NOW(), NOW()),
(24, 'team.update', NOW(), NOW()),
(25, 'team.delete', NOW(), NOW()),
(26, 'team_member.manage', NOW(), NOW()),

-- Schedule & Match Management
(27, 'schedule.list', NOW(), NOW()),
(28, 'schedule.create', NOW(), NOW()),
(29, 'schedule.update', NOW(), NOW()),
(30, 'schedule.delete', NOW(), NOW()),
(31, 'match.view', NOW(), NOW()),
(32, 'match.record_result', NOW(), NOW()),
(33, 'match.review_result', NOW(), NOW()),

-- Entry Management
(34, 'entry.view', NOW(), NOW()),
(35, 'entry.register', NOW(), NOW()),
(36, 'entry.list', NOW(), NOW()),

-- ELO Management
(37, 'elo.view', NOW(), NOW()),
(38, 'elo.recalculate', NOW(), NOW());

-- =============================================
-- SEED ROLE-PERMISSION MAPPINGS
-- =============================================

-- Admin: Full access
INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT 1, `id`, NOW(), NOW() FROM `permissions`;

-- Organizer: Tournament management
INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`) VALUES
(2, 14, NOW(), NOW()), -- tournament.list
(2, 15, NOW(), NOW()), -- tournament.view
(2, 16, NOW(), NOW()), -- tournament.create
(2, 17, NOW(), NOW()), -- tournament.update
(2, 19, NOW(), NOW()), -- tournament.manage_category
(2, 20, NOW(), NOW()), -- tournament.manage_referees
(2, 21, NOW(), NOW()), -- team.list
(2, 23, NOW(), NOW()), -- team.create
(2, 24, NOW(), NOW()), -- team.update
(2, 26, NOW(), NOW()), -- team_member.manage
(2, 27, NOW(), NOW()), -- schedule.list
(2, 28, NOW(), NOW()), -- schedule.create
(2, 29, NOW(), NOW()), -- schedule.update
(2, 31, NOW(), NOW()), -- match.view
(2, 36, NOW(), NOW()), -- entry.list
(2, 37, NOW(), NOW()), -- elo.view
(2, 2, NOW(), NOW()),  -- user.view
(2, 30, NOW(), NOW()); -- schedule.delete

-- Referee: Match officiation
INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`) VALUES
(3, 31, NOW(), NOW()), -- match.view
(3, 32, NOW(), NOW()), -- match.record_result
(3, 33, NOW(), NOW()), -- match.review_result
(3, 34, NOW(), NOW()), -- entry.view
(3, 37, NOW(), NOW()), -- elo.view
(3, 27, NOW(), NOW()), -- schedule.list
(3, 2, NOW(), NOW()); -- user.view

-- Player: Read-only + register
INSERT IGNORE INTO `role_permissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`) VALUES
(4, 35, NOW(), NOW()), -- entry.register
(4, 14, NOW(), NOW()), -- tournament.list
(4, 15, NOW(), NOW()), -- tournament.view
(4, 31, NOW(), NOW()), -- match.view
(4, 34, NOW(), NOW()), -- entry.view
(4, 37, NOW(), NOW()), -- elo.view
(4, 2, NOW(), NOW()); -- user.view
