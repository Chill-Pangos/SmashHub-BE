-- ==========================================
-- Fix User Roles - Insert missing user_roles
-- ==========================================
-- This file adds role assignments for all users in the database
-- Run this if user_roles table is empty

-- ==========================================
-- Insert Roles to Users
-- ==========================================

-- Admin role (1 user)
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'admin';

-- Athlete role (100 users)
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username LIKE 'athlete%' AND r.name = 'athlete';

-- Coach role (100 users)
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username LIKE 'coach%' AND r.name = 'coach';

-- Referee role (100 users)
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username LIKE 'referee%' AND r.name = 'referee';

-- Organizer role (100 users)
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username LIKE 'organizer%' AND r.name = 'organizer';

-- Chief Referee role (100 users)
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username LIKE 'chief_referee%' AND r.name = 'chief_referee';

-- Team Manager role (100 users)
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username LIKE 'team_manager%' AND r.name = 'team_manager';

-- Spectator role (100 users)
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username LIKE 'spectator%' AND r.name = 'spectator';

-- ==========================================
-- Verify the results
-- ==========================================
SELECT '=== VERIFICATION ===' as step;

-- Show total user_roles created
SELECT 'Total user_roles:' as info, COUNT(*) as count FROM user_roles;

-- Show role distribution
SELECT r.name as role, COUNT(ur.userId) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.roleId
GROUP BY r.id, r.name
ORDER BY r.id;

-- Test admin user
SELECT u.username, u.email, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
WHERE u.username = 'admin';

SELECT 'User roles fixed successfully! Try login again.' as message;
