-- ============================================================================
-- SmashHub Default Seed Data
-- Version: 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ROLES
-- ----------------------------------------------------------------------------

INSERT INTO `roles` (`name`, `description`) VALUES
  ('admin', 'System administrator with full access'),
  ('user', 'Regular user who can register for tournaments'),
  ('chief_referee', 'Chief referee who can approve and oversee match results'),
  ('referee', 'Tournament referee who can manage matches'),
  ('organizer', 'Tournament organizer who can create and manage tournaments');

-- ----------------------------------------------------------------------------
-- PERMISSIONS
-- ----------------------------------------------------------------------------

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

  -- Knockout permissions
  ('knockouts:view'),
  ('knockouts:create'),
  ('knockouts:update'),
  ('knockouts:delete'),

  -- Group permissions
  ('groups:view'),
  ('groups:create'),
  ('groups:update'),
  ('groups:delete'),

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

  -- Sub Match permissions
  ('submatches:view'),
  ('submatches:create'),
  ('submatches:start'),
  ('submatches:update'),
  ('submatches:delete'),

  -- Match sets permissions
  ('matchsets:view'),
  ('matchsets:create'),
  ('matchsets:update'),
  ('matchsets:delete'),

  -- Schedule permissions
  ('schedules:view'),
  ('schedules:create'),
  ('schedules:update'),
  ('schedules:delete'),

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
  ('notifications:manage'),

  -- Payment permissions
  ('payments:view'),
  ('payments:create'),
  ('payments:update');

-- ----------------------------------------------------------------------------
-- ROLE PERMISSIONS
-- ----------------------------------------------------------------------------

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
  'tournaments:view',
  'category:view',
  'entries:view',
  'entries:create',
  'entries:update',
  'entries:approve',
  'matches:view',
  'schedules:view',
  'elo:view',
  'notifications:view',
  'payments:view',
  'payments:create',
  'payments:update'
);

-- Referee permissions
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 
  (SELECT `id` FROM `roles` WHERE `name` = 'referee'),
  `id`
FROM `permissions` 
WHERE `name` IN (
  'users:view',
  'tournaments:view',
  'category:view',
  'entries:view',
  'matches:view',
  'matches:start',
  'submatches:view',
  'submatches:update',
  'submatches:start',
  'matchsets:view',
  'matchsets:create',
  'matchsets:update',
  'matchsets:delete',
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
  'tournaments:view',
  'category:view',
  'entries:view',
  'entries:update',
  'matches:view',
  'matches:update',
  'matches:start',
  'matches:report_result',
  'matches:approve_result',
  'knockouts:update',
  'submatches:view',
  'matchsets:view',
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
  'tournaments:view',
  'tournaments:create',
  'tournaments:update',
  'tournaments:manage',
  'tournaments:delete',
  'category:view',
  'category:create',
  'category:update',
  'category:delete',
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
  'schedules:view',
  'schedules:create',
  'schedules:update',
  'groups:view',
  'groups:create',
  'groups:update',
  'groups:delete',
  'knockouts:view',
  'knockouts:create',
  'knockouts:delete',
  'submatches:view',
  'submatches:create',
  'submatches:start',
  'submatches:update',
  'submatches:delete',
  'matchsets:view',
  'matchsets:create',
  'matchsets:update',
  'matchsets:delete',
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
-- Generated: 2026-06-10
-- IDs:
--   1: admin
--   2: organizer
--   3-202: user accounts (200)
--   203-352: referee accounts (150)
--   353-402: chief_referee accounts (50)
--   403-702: additional user accounts (300)
--   703-1052: additional referee accounts (350)
--   1053-1502: additional chief_referee accounts (450)
-- Totals:
--   user: 500 accounts
--   referee: 500 accounts
--   chief_referee: 500 accounts
-- ============================================================================

INSERT INTO `users` (`id`, `firstName`, `lastName`, `email`, `password`, `isEmailVerified`, `gender`, `avatarUrl`, `dob`, `phoneNumber`, `createdAt`, `updatedAt`)
WITH digits AS (
  SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
  UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
), seq AS (
  SELECT ones.d + tens.d * 10 + hundreds.d * 100 + thousands.d * 1000 + 1 AS n
  FROM digits ones
  CROSS JOIN digits tens
  CROSS JOIN digits hundreds
  CROSS JOIN digits thousands
), named_users AS (
  SELECT
    n AS `id`,
    CASE
      WHEN n = 1 THEN 'Admin'
      WHEN n = 2 THEN 'Organizer'
      ELSE ELT(1 + MOD(n - 3, 40),
        'Minh', 'Linh', 'An', 'Bao', 'Chau', 'Duy', 'Giang', 'Hai', 'Hanh', 'Hoang',
        'Khanh', 'Lan', 'Long', 'Mai', 'Nam', 'Nga', 'Nghia', 'Nhi', 'Phong', 'Phuc',
        'Quang', 'Quyen', 'Son', 'Tam', 'Thao', 'Thinh', 'Trang', 'Trung', 'Tuan', 'Tung',
        'Uy', 'Van', 'Vi', 'Viet', 'Vy', 'Yen', 'Khoa', 'Lam', 'Hieu', 'My'
      )
    END AS `firstName`,
    CASE
      WHEN n IN (1, 2) THEN 'Account'
      ELSE ELT(1 + MOD(n - 3, 24),
        'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu',
        'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly',
        'Truong', 'Dinh', 'Mai', 'Cao', 'Luu', 'Trinh', 'Ta', 'Lam'
      )
    END AS `lastName`,
    CASE
      WHEN n = 1 THEN 'admin@test.com'
      WHEN n = 2 THEN 'organizer@test.com'
      WHEN n BETWEEN 3 AND 202 THEN CONCAT('user', n - 2, '@test.com')
      WHEN n BETWEEN 203 AND 352 THEN CONCAT('referee', n - 202, '@test.com')
      WHEN n BETWEEN 353 AND 402 THEN CONCAT('chief_referee', n - 352, '@test.com')
      WHEN n BETWEEN 403 AND 702 THEN CONCAT('user', n - 202, '@test.com')
      WHEN n BETWEEN 703 AND 1052 THEN CONCAT('referee', n - 552, '@test.com')
      ELSE CONCAT('chief_referee', n - 1002, '@test.com')
    END AS `email`,
    CASE
      WHEN n = 1 THEN 'male'
      WHEN n = 2 THEN 'female'
      ELSE IF(MOD(n, 2) = 1, 'male', 'female')
    END AS `gender`,
    CASE
      WHEN n = 1 THEN '1990-01-01'
      WHEN n = 2 THEN '1991-02-02'
      ELSE STR_TO_DATE(CONCAT(1990 + MOD(n - 3, 20), '-', LPAD(1 + MOD(n - 3, 12), 2, '0'), '-', LPAD(1 + MOD(n - 3, 28), 2, '0')), '%Y-%m-%d')
    END AS `dob`,
    CONCAT('https://api.dicebear.com/7.x/initials/svg?seed=smashhub-', n) AS `avatarUrl`,
    CONCAT('+849', LPAD(n, 8, '0')) AS `phoneNumber`
  FROM seq
  WHERE n <= 1502
)
SELECT
  `id`,
  `firstName`,
  `lastName`,
  `email`,
  '$2b$10$WSTW/8cDMbNokSu89L4jlOhkIxrHnUitCT.beHYzdeRIgLeUDsueK' AS `password`,
  1 AS `isEmailVerified`,
  `gender`,
  `avatarUrl`,
  `dob`,
  `phoneNumber`,
  '2026-05-20 00:00:00' AS `createdAt`,
  '2026-05-20 00:00:00' AS `updatedAt`
FROM named_users;

INSERT INTO `user_roles` (`userId`, `roleId`, `createdAt`, `updatedAt`)
WITH digits AS (
  SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
  UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
), seq AS (
  SELECT ones.d + tens.d * 10 + hundreds.d * 100 + thousands.d * 1000 + 1 AS n
  FROM digits ones
  CROSS JOIN digits tens
  CROSS JOIN digits hundreds
  CROSS JOIN digits thousands
)
SELECT
  n AS `userId`,
  CASE
    WHEN n = 1 THEN 1
    WHEN n = 2 THEN 5
    WHEN n BETWEEN 3 AND 202 THEN 2
    WHEN n BETWEEN 203 AND 352 THEN 4
    WHEN n BETWEEN 353 AND 402 THEN 3
    WHEN n BETWEEN 403 AND 702 THEN 2
    WHEN n BETWEEN 703 AND 1052 THEN 4
    ELSE 3
  END AS `roleId`,
  '2026-05-20 00:00:00' AS `createdAt`,
  '2026-05-20 00:00:00' AS `updatedAt`
FROM seq
WHERE n <= 1502;
