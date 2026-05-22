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

-- ============================================================================
-- Seed Data: users
-- Password: Password123!
-- Hash: $2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK
-- Generated: 2026-05-20
-- IDs: sequential 1 to 105
-- ============================================================================

INSERT INTO `users` (`id`, `firstName`, `lastName`, `email`, `password`, `isEmailVerified`, `gender`, `avatarUrl`, `dob`, `phoneNumber`, `createdAt`, `updatedAt`) VALUES
(1, 'Đặng', 'Thái Tuấn', 'tuandt1409@gmail.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 0, NULL, NULL, NULL, NULL, '2026-04-06 21:11:49', '2026-04-06 21:11:49'),
(2, 'Đặng', 'Thái Tuấn', 'suraimuneko.tfc@gmail.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 0, NULL, NULL, NULL, NULL, '2026-04-06 21:19:31', '2026-04-06 21:19:31'),
(3, 'Vo Tran Minh', 'Admin', 'admin@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, NULL, NULL, NULL, NULL, '2026-04-08 06:09:46', '2026-04-08 06:14:04'),
(4, 'Nguyen', 'Organizer', 'organizer@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, NULL, NULL, NULL, NULL, '2026-04-08 06:22:52', '2026-04-08 06:23:20'),
(5, 'Đinh', 'Huy', 'user1@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2010-07-05', NULL, '2026-04-13 05:19:36', '2026-05-13 20:13:33'),
(6, 'Hoàng', 'Hòa', 'user2@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2012-04-10', NULL, '2026-04-13 05:19:36', '2026-04-13 05:19:36'),
(7, 'Robert', 'Jones', 'user3@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1999-05-21', NULL, '2026-04-13 05:19:36', '2026-04-13 05:19:36'),
(8, 'Bùi', 'Martinez', 'user4@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2013-09-13', NULL, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(9, 'Nguyễn', 'Davis', 'user5@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1998-04-26', NULL, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(10, 'Jane', 'Anh', 'user6@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2005-01-26', NULL, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(11, 'James', 'Hòa', 'user7@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2009-10-06', NULL, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(12, 'Bùi', 'Hòa', 'user8@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2011-01-07', NULL, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(13, 'Nguyễn', 'Martinez', 'user9@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2006-11-18', NULL, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(14, 'Lê', 'Martinez', 'user10@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1995-07-07', NULL, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(15, 'Emma', 'Huy', 'user11@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2009-06-12', NULL, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(16, 'Robert', 'Brown', 'user12@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2009-05-07', NULL, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(17, 'Đinh', 'Jones', 'user13@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2012-08-10', NULL, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(18, 'Đinh', 'Williams', 'user14@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2004-12-20', NULL, '2026-04-13 05:19:39', '2026-04-13 05:19:39'),
(19, 'Nguyễn', 'Brown', 'user15@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2007-02-25', NULL, '2026-04-13 05:19:39', '2026-04-13 05:19:39'),
(20, 'James', 'Hòa', 'user16@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2013-03-23', NULL, '2026-04-13 05:19:39', '2026-04-13 05:19:39'),
(21, 'James', 'Williams', 'user17@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2008-06-22', NULL, '2026-04-13 05:19:39', '2026-04-13 05:19:39'),
(22, 'David', 'Trang', 'user18@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2013-07-27', NULL, '2026-04-13 05:19:39', '2026-04-13 05:19:39'),
(23, 'Emma', 'Duy', 'user19@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1996-05-01', NULL, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(24, 'Lê', 'Brown', 'user20@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2002-01-06', NULL, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(25, 'Michael', 'Linh', 'user21@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2006-09-12', NULL, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(26, 'Đặng', 'Minh', 'user22@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2000-07-12', NULL, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(27, 'Michael', 'Martinez', 'user23@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2002-11-14', NULL, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(28, 'Mary', 'Garcia', 'user24@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2013-11-06', NULL, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(29, 'Jane', 'Williams', 'user25@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2011-05-04', NULL, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(30, 'Lê', 'Huy', 'user26@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2007-01-03', NULL, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(31, 'Hoàng', 'Smith', 'user27@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2008-06-03', NULL, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(32, 'Lê', 'Huy', 'user28@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2007-03-04', NULL, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(33, 'David', 'Minh', 'user29@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2006-01-22', NULL, '2026-04-13 05:19:42', '2026-04-13 05:19:42'),
(34, 'Hoàng', 'Linh', 'user30@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1996-05-04', NULL, '2026-04-13 05:19:42', '2026-04-13 05:19:42'),
(35, 'Robert', 'Martinez', 'user31@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2013-06-26', NULL, '2026-04-13 05:19:42', '2026-04-13 05:19:42'),
(36, 'Võ', 'Phong', 'user32@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1996-12-24', NULL, '2026-04-13 05:19:42', '2026-04-13 05:19:42'),
(37, 'Robert', 'Huy', 'user33@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2011-09-03', NULL, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(38, 'Michael', 'Linh', 'user34@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2009-11-27', NULL, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(39, 'Lê', 'Miller', 'user35@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2011-01-16', NULL, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(40, 'Nguyễn', 'Johnson', 'user36@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2005-02-07', NULL, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(41, 'Robert', 'Trang', 'user37@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1996-07-11', NULL, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(42, 'Nguyễn', 'Hòa', 'user38@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2011-07-03', NULL, '2026-04-13 05:19:44', '2026-04-13 05:19:44'),
(43, 'Michael', 'Anh', 'user39@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2002-03-04', NULL, '2026-04-13 05:19:44', '2026-04-13 05:19:44'),
(44, 'Lê', 'Smith', 'user40@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2003-08-15', NULL, '2026-04-13 05:19:44', '2026-04-13 05:19:44'),
(45, 'Phạm', 'Linh', 'user41@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2001-04-12', NULL, '2026-04-13 05:19:44', '2026-04-13 05:19:44'),
(46, 'Trần', 'Garcia', 'user42@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2004-07-19', NULL, '2026-04-13 05:19:45', '2026-04-13 05:19:45'),
(47, 'John', 'Tuấn', 'user43@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2007-09-23', NULL, '2026-04-13 05:19:45', '2026-04-13 05:19:45'),
(48, 'Mary', 'Hải', 'user44@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1993-11-08', NULL, '2026-04-13 05:19:45', '2026-04-13 05:19:45'),
(49, 'Lisa', 'Johnson', 'user45@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2012-02-14', NULL, '2026-04-13 05:19:45', '2026-04-13 05:19:45'),
(50, 'Tô', 'Duy', 'user46@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2010-05-30', NULL, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(51, 'Trần', 'Rodriguez', 'user47@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2008-03-17', NULL, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(52, 'Đinh', 'Phong', 'user48@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2003-12-01', NULL, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(53, 'Emma', 'Smith', 'user49@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1997-06-11', NULL, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(54, 'Hoàng', 'Davis', 'user50@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2005-08-29', NULL, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(55, 'Phạm', 'Brown', 'user51@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2009-01-15', NULL, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(56, 'David', 'Johnson', 'user52@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2000-10-03', NULL, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(57, 'Bùi', 'Garcia', 'user53@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2011-04-22', NULL, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(58, 'John', 'Minh', 'user54@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1994-07-08', NULL, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(59, 'Mary', 'Williams', 'user55@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2006-08-14', NULL, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(60, 'Võ', 'Hải', 'user56@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1992-03-25', NULL, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(61, 'Lisa', 'Garcia', 'user57@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2008-11-06', NULL, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(62, 'David', 'Williams', 'user58@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1995-01-07', NULL, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(63, 'James', 'Duy', 'user59@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2006-02-28', NULL, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(64, 'Jane', 'Rodriguez', 'user60@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1991-09-25', NULL, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(65, 'Trần', 'Trang', 'user61@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2000-08-27', NULL, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(66, 'Tô', 'Rodriguez', 'user62@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2010-10-26', NULL, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(67, 'Emma', 'Brown', 'user63@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1991-07-01', NULL, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(68, 'Đặng', 'Trang', 'user64@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2002-04-25', NULL, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(69, 'Lê', 'Huy', 'user65@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2002-08-23', NULL, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(70, 'Bùi', 'Martinez', 'user66@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2008-12-28', NULL, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(71, 'John', 'Phong', 'user67@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1991-01-01', NULL, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(72, 'Võ', 'Trang', 'user68@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1998-06-17', NULL, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(73, 'Võ', 'Garcia', 'user69@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2007-05-21', NULL, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(74, 'Phạm', 'Hải', 'user70@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '1995-07-17', NULL, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(75, 'Phạm', 'Davis', 'user71@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2010-10-21', NULL, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(76, 'Đinh', 'Duy', 'user72@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2008-04-24', NULL, '2026-04-13 05:19:51', '2026-04-13 05:19:51'),
(77, 'Võ', 'Garcia', 'user73@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2009-08-11', NULL, '2026-04-13 05:19:51', '2026-04-13 05:19:51'),
(78, 'Hoàng', 'Martinez', 'user74@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1999-09-16', NULL, '2026-04-13 05:19:51', '2026-04-13 05:19:51'),
(79, 'Võ', 'Trang', 'user75@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2005-03-26', NULL, '2026-04-13 05:19:51', '2026-04-13 05:19:51'),
(80, 'David', 'Davis', 'user76@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2001-03-20', NULL, '2026-04-13 05:19:51', '2026-04-13 05:19:51'),
(81, 'James', 'Duy', 'user77@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2005-09-07', NULL, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(82, 'Michael', 'Anh', 'user78@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1997-08-13', NULL, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(83, 'John', 'Minh', 'user79@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2013-12-21', NULL, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(84, 'James', 'Rodriguez', 'user80@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1993-02-28', NULL, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(85, 'Nguyễn', 'Phong', 'user81@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1999-06-19', NULL, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(86, 'Nguyễn', 'Garcia', 'user82@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2010-03-18', NULL, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(87, 'Tô', 'Anh', 'user83@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1990-11-13', NULL, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(88, 'Tô', 'Huy', 'user84@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2014-04-07', NULL, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(89, 'Hoàng', 'Martinez', 'user85@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2009-12-17', NULL, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(90, 'James', 'Minh', 'user86@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2013-11-13', NULL, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(91, 'Phạm', 'Trang', 'user87@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2006-09-26', NULL, '2026-04-13 05:19:54', '2026-04-13 05:19:54'),
(92, 'John', 'Davis', 'user88@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2004-06-19', NULL, '2026-04-13 05:19:54', '2026-04-13 05:19:54'),
(93, 'Emma', 'Brown', 'user89@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2002-05-09', NULL, '2026-04-13 05:19:54', '2026-04-13 05:19:54'),
(94, 'Phạm', 'Johnson', 'user90@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2009-12-22', NULL, '2026-04-13 05:19:54', '2026-04-13 05:19:54'),
(95, 'Tô', 'Phong', 'user91@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2005-06-02', NULL, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(96, 'Tô', 'Davis', 'user92@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2012-06-27', NULL, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(97, 'Hoàng', 'Phong', 'user93@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1996-10-12', NULL, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(98, 'David', 'Hải', 'user94@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1992-10-18', NULL, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(99, 'Võ', 'Williams', 'user95@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2006-07-26', NULL, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(100, 'Lisa', 'Tuấn', 'user96@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1994-12-23', NULL, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(101, 'Lê', 'Duy', 'user97@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1994-03-02', NULL, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(102, 'Mary', 'Anh', 'user98@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'female', NULL, '2000-07-19', NULL, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(103, 'Nguyễn', 'Davis', 'user99@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2011-12-04', NULL, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(104, 'Jane', 'Tuấn', 'user100@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '2010-12-07', NULL, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(105, 'Nguyễn', 'Brown', 'chief_referee@test.com', '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK', 1, 'male', NULL, '1985-06-15', NULL, '2026-04-13 05:19:57', '2026-04-13 05:19:57');

-- ============================================================================
-- Seed Data: user_roles
-- Generated: 2026-05-20
-- userId mapped to sequential IDs from seed_users.sql
-- ============================================================================

INSERT INTO `user_roles` (`userId`, `roleId`, `createdAt`, `updatedAt`) VALUES
(1, 2, '2026-04-06 21:19:31', '2026-04-06 21:19:31'),
(2, 2, '2026-04-06 21:19:31', '2026-04-06 21:19:31'),
(3, 1, '2026-04-08 06:09:46', '2026-04-08 06:13:14'),
(4, 5, '2026-04-08 06:22:52', '2026-04-08 06:23:38'),
(5, 2, '2026-04-13 05:19:36', '2026-04-13 05:19:36'),
(6, 2, '2026-04-13 05:19:36', '2026-04-13 05:19:36'),
(7, 2, '2026-04-13 05:19:36', '2026-04-13 05:19:36'),
(8, 2, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(9, 2, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(10, 2, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(11, 2, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(12, 2, '2026-04-13 05:19:37', '2026-04-13 05:19:37'),
(13, 2, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(14, 2, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(15, 2, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(16, 2, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(17, 2, '2026-04-13 05:19:38', '2026-04-13 05:19:38'),
(18, 2, '2026-04-13 05:19:39', '2026-04-13 05:19:39'),
(19, 2, '2026-04-13 05:19:39', '2026-04-13 05:19:39'),
(20, 2, '2026-04-13 05:19:39', '2026-04-13 05:19:39'),
(21, 2, '2026-04-13 05:19:39', '2026-04-13 05:19:39'),
(22, 2, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(23, 2, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(24, 2, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(25, 2, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(26, 2, '2026-04-13 05:19:40', '2026-04-13 05:19:40'),
(27, 2, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(28, 2, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(29, 2, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(30, 2, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(31, 2, '2026-04-13 05:19:41', '2026-04-13 05:19:41'),
(32, 2, '2026-04-13 05:19:42', '2026-04-13 05:19:42'),
(33, 2, '2026-04-13 05:19:42', '2026-04-13 05:19:42'),
(34, 2, '2026-04-13 05:19:42', '2026-04-13 05:19:42'),
(35, 2, '2026-04-13 05:19:42', '2026-04-13 05:19:42'),
(36, 2, '2026-04-13 05:19:42', '2026-04-13 05:19:42'),
(37, 2, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(38, 2, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(39, 2, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(40, 2, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(41, 2, '2026-04-13 05:19:43', '2026-04-13 05:19:43'),
(42, 2, '2026-04-13 05:19:44', '2026-04-13 05:19:44'),
(43, 2, '2026-04-13 05:19:44', '2026-04-13 05:19:44'),
(44, 2, '2026-04-13 05:19:44', '2026-04-13 05:19:44'),
(45, 2, '2026-04-13 05:19:44', '2026-04-13 05:19:44'),
(46, 2, '2026-04-13 05:19:44', '2026-04-13 05:19:44'),
(47, 2, '2026-04-13 05:19:45', '2026-04-13 05:19:45'),
(48, 2, '2026-04-13 05:19:45', '2026-04-13 05:19:45'),
(49, 2, '2026-04-13 05:19:45', '2026-04-13 05:19:45'),
(50, 2, '2026-04-13 05:19:45', '2026-04-13 05:19:45'),
(51, 2, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(52, 2, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(53, 2, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(54, 2, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(55, 4, '2026-04-13 05:19:46', '2026-04-13 05:19:46'),
(56, 4, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(57, 4, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(58, 4, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(59, 4, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(60, 4, '2026-04-13 05:19:47', '2026-04-13 05:19:47'),
(61, 4, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(62, 4, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(63, 4, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(64, 4, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(65, 4, '2026-04-13 05:19:48', '2026-04-13 05:19:48'),
(66, 4, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(67, 4, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(68, 4, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(69, 4, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(70, 4, '2026-04-13 05:19:49', '2026-04-13 05:19:49'),
(71, 4, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(72, 4, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(73, 4, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(74, 4, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(75, 4, '2026-04-13 05:19:50', '2026-04-13 05:19:50'),
(76, 4, '2026-04-13 05:19:51', '2026-04-13 05:19:51'),
(77, 4, '2026-04-13 05:19:51', '2026-04-13 05:19:51'),
(78, 4, '2026-04-13 05:19:51', '2026-04-13 05:19:51'),
(79, 4, '2026-04-13 05:19:51', '2026-04-13 05:19:51'),
(80, 4, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(81, 4, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(82, 4, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(83, 4, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(84, 4, '2026-04-13 05:19:52', '2026-04-13 05:19:52'),
(85, 4, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(86, 4, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(87, 4, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(88, 4, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(89, 4, '2026-04-13 05:19:53', '2026-04-13 05:19:53'),
(90, 4, '2026-04-13 05:19:54', '2026-04-13 05:19:54'),
(91, 4, '2026-04-13 05:19:54', '2026-04-13 05:19:54'),
(92, 4, '2026-04-13 05:19:54', '2026-04-13 05:19:54'),
(93, 4, '2026-04-13 05:19:54', '2026-04-13 05:19:54'),
(94, 4, '2026-04-13 05:19:54', '2026-04-13 05:19:54'),
(95, 4, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(96, 4, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(97, 4, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(98, 4, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(99, 4, '2026-04-13 05:19:55', '2026-04-13 05:19:55'),
(100, 4, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(101, 4, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(102, 4, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(103, 4, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(104, 4, '2026-04-13 05:19:56', '2026-04-13 05:19:56'),
(105, 3, '2026-04-13 05:19:57', '2026-04-13 05:19:57');