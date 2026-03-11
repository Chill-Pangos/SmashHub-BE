-- Permissions and Role Permissions Seed Data
-- This file defines all permissions and assigns them to appropriate roles

SET FOREIGN_KEY_CHECKS=0;

TRUNCATE TABLE role_permissions;
TRUNCATE TABLE permissions;

SET FOREIGN_KEY_CHECKS=1;

-- ==========================================
-- Create Permissions
-- ==========================================

INSERT INTO permissions (name) VALUES
-- User Management
('users.view'),
('users.create'),
('users.update'),
('users.delete'),

-- Tournament Management
('tournaments.view'),
('tournaments.create'),
('tournaments.update'),
('tournaments.delete'),
('tournaments.manage'),

-- Match Management
('matches.view'),
('matches.create'),
('matches.update'),
('matches.delete'),
('matches.start'),
('matches.report_result'),
('matches.approve_result'),

-- Schedule Management
('schedules.view'),
('schedules.create'),
('schedules.update'),
('schedules.delete'),

-- Entry Management
('entries.view'),
('entries.create'),
('entries.update'),
('entries.delete'),
('entries.approve'),

-- Team Management
('teams.view'),
('teams.create'),
('teams.update'),
('teams.delete'),
('teams.manage_members'),

-- Complaint Management
('complaints.view'),
('complaints.create'),
('complaints.update'),
('complaints.resolve'),
('complaints.assign'),

-- ELO Management
('elo.view'),
('elo.manage'),

-- Role & Permission Management
('roles.view'),
('roles.create'),
('roles.update'),
('roles.delete'),
('permissions.view'),
('permissions.manage'),

-- Notification Management
('notifications.view'),
('notifications.send'),

-- Content Management
('content.view'),
('content.create'),
('content.update'),
('content.delete');

-- ==========================================
-- Assign Permissions to Roles
-- ==========================================

-- ADMIN: Full access
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin';

-- ORGANIZER: Tournament and event management
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'organizer' AND p.name IN (
    'tournaments.view', 'tournaments.create', 'tournaments.update', 'tournaments.delete', 'tournaments.manage',
    'matches.view', 'matches.create', 'matches.update', 'matches.delete',
    'schedules.view', 'schedules.create', 'schedules.update', 'schedules.delete',
    'entries.view', 'entries.create', 'entries.update', 'entries.approve',
    'teams.view', 'teams.create', 'teams.update',
    'users.view',
    'complaints.view', 'complaints.resolve', 'complaints.assign',
    'notifications.view', 'notifications.send',
    'content.view', 'content.create', 'content.update', 'content.delete'
);

-- CHIEF_REFEREE: Match result approval and referee management
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'chief_referee' AND p.name IN (
    'tournaments.view',
    'matches.view', 'matches.approve_result', 'matches.update',
    'schedules.view',
    'entries.view',
    'users.view',
    'complaints.view', 'complaints.resolve',
    'elo.view'
);

-- REFEREE: Match management and reporting
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'referee' AND p.name IN (
    'tournaments.view',
    'matches.view', 'matches.start', 'matches.report_result', 'matches.update',
    'schedules.view',
    'entries.view',
    'users.view'
);

-- COACH: Team and player management
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'coach' AND p.name IN (
    'tournaments.view',
    'matches.view',
    'schedules.view',
    'entries.view',
    'teams.view', 'teams.update', 'teams.manage_members',
    'users.view',
    'elo.view',
    'complaints.view', 'complaints.create'
);

-- TEAM_MANAGER: Team operations
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'team_manager' AND p.name IN (
    'tournaments.view',
    'matches.view',
    'schedules.view',
    'entries.view', 'entries.create',
    'teams.view', 'teams.create', 'teams.update', 'teams.manage_members',
    'users.view',
    'complaints.view', 'complaints.create'
);

-- ATHLETE: View and participate
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'athlete' AND p.name IN (
    'tournaments.view',
    'matches.view',
    'schedules.view',
    'entries.view',
    'teams.view',
    'users.view',
    'elo.view',
    'complaints.view', 'complaints.create'
);

-- SPECTATOR: Read-only access
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'spectator' AND p.name IN (
    'tournaments.view',
    'matches.view',
    'schedules.view',
    'entries.view',
    'teams.view',
    'users.view',
    'elo.view'
);
