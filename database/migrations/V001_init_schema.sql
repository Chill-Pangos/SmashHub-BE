-- SmashHub Database Schema
-- Version: V001
-- Description: Initial schema creation for SmashHub backend

CREATE DATABASE IF NOT EXISTS SMASHHUB_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- User Management Tables
-- ==========================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    isEmailVerified BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userId INT UNSIGNED NOT NULL,
    avatarUrl VARCHAR(255),
    dob DATE,
    phoneNumber VARCHAR(20),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userId INT UNSIGNED NOT NULL,
    roleId INT UNSIGNED NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (userId, roleId),
    INDEX idx_userId (userId),
    INDEX idx_roleId (roleId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role Permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    roleId INT UNSIGNED NOT NULL,
    permissionId INT UNSIGNED NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (roleId, permissionId),
    INDEX idx_roleId (roleId),
    INDEX idx_permissionId (permissionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Authentication & Security Tables
-- ==========================================

-- Access Tokens table
CREATE TABLE IF NOT EXISTS access_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userId INT UNSIGNED NOT NULL,
    token TEXT NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    isBlacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    blacklistedAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userId INT UNSIGNED NOT NULL,
    token TEXT NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    isBlacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    blacklistedAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTPs table
CREATE TABLE IF NOT EXISTS otps (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userId INT UNSIGNED NOT NULL,
    code VARCHAR(6) NOT NULL,
    type ENUM('password_reset', 'email_verification') NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    isUsed BOOLEAN DEFAULT FALSE,
    usedAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_code (code),
    INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Tournament Management Tables
-- ==========================================

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('upcoming', 'ongoing', 'completed') NOT NULL DEFAULT 'upcoming',
    startDate TIMESTAMP NOT NULL,
    endDate TIMESTAMP NULL,
    location VARCHAR(100) NOT NULL,
    createdBy INT UNSIGNED NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_startDate (startDate),
    INDEX idx_createdBy (createdBy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tournament Contents table
CREATE TABLE IF NOT EXISTS tournament_contents (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournamentId INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('single', 'team', 'double') NOT NULL,
    maxEntries INT UNSIGNED NOT NULL,
    maxSets INT UNSIGNED NOT NULL,
    numberOfSingles INT UNSIGNED NULL,
    numberOfDoubles INT UNSIGNED NULL,
    minAge INT UNSIGNED,
    maxAge INT UNSIGNED,
    minElo INT UNSIGNED,
    maxElo INT UNSIGNED,
    racketCheck BOOLEAN NOT NULL,
    isGroupStage BOOLEAN,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
    INDEX idx_tournamentId (tournamentId),
    INDEX idx_type (type)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contentId INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contentId) REFERENCES tournament_contents(id) ON DELETE CASCADE,
    INDEX idx_contentId (contentId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entry Members table
CREATE TABLE IF NOT EXISTS entry_members (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    entryId INT UNSIGNED NOT NULL,
    userId INT UNSIGNED NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entryId) REFERENCES entries(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_entry_user (entryId, userId),
    INDEX idx_entryId (entryId),
    INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contentId INT UNSIGNED NOT NULL,
    roundNumber INT UNSIGNED,
    groupName VARCHAR(50),
    scheduledAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contentId) REFERENCES tournament_contents(id) ON DELETE CASCADE,
    INDEX idx_contentId (contentId),
    INDEX idx_scheduledAt (scheduledAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    scheduleId INT UNSIGNED NOT NULL,
    entryAId INT UNSIGNED NOT NULL,
    entryBId INT UNSIGNED NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL,
    winnerEntryId INT UNSIGNED,
    umpire INT UNSIGNED,
    assistantUmpire INT UNSIGNED,
    coachAId INT UNSIGNED,
    coachBId INT UNSIGNED,
    isConfirmedByWinner BOOLEAN,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (entryAId) REFERENCES entries(id) ON DELETE CASCADE,
    FOREIGN KEY (entryBId) REFERENCES entries(id) ON DELETE CASCADE,
    FOREIGN KEY (winnerEntryId) REFERENCES entries(id) ON DELETE SET NULL,
    FOREIGN KEY (umpire) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assistantUmpire) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (coachAId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (coachBId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_scheduleId (scheduleId),
    INDEX idx_entryAId (entryAId),
    INDEX idx_entryBId (entryBId),
    INDEX idx_status (status),
    INDEX idx_winnerEntryId (winnerEntryId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Match Sets table
CREATE TABLE IF NOT EXISTS match_sets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matchId INT UNSIGNED NOT NULL,
    setNumber INT UNSIGNED NOT NULL,
    entryAScore INT UNSIGNED NOT NULL DEFAULT 0,
    entryBScore INT UNSIGNED NOT NULL DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
    INDEX idx_matchId (matchId),
    UNIQUE KEY unique_match_set (matchId, setNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- ELO Rating System Tables
-- ==========================================

-- ELO Scores table
CREATE TABLE IF NOT EXISTS elo_scores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userId INT UNSIGNED NOT NULL,
    score INT NOT NULL DEFAULT 1000,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ELO Histories table
CREATE TABLE IF NOT EXISTS elo_histories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matchId INT UNSIGNED NOT NULL,
    userId INT UNSIGNED NOT NULL,
    previousElo INT NOT NULL,
    newElo INT NOT NULL,
    changeReason VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_matchId (matchId),
    INDEX idx_userId (userId),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Complaint Management Tables
-- ==========================================

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    createdBy INT UNSIGNED NOT NULL,
    tournamentId INT UNSIGNED NOT NULL,
    matchId INT UNSIGNED,
    topic VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('submitted', 'under_review', 'escalated', 'resolved', 'rejected') NOT NULL DEFAULT 'submitted',
    currentHandlerId INT UNSIGNED,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE SET NULL,
    FOREIGN KEY (currentHandlerId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_createdBy (createdBy),
    INDEX idx_tournamentId (tournamentId),
    INDEX idx_matchId (matchId),
    INDEX idx_status (status),
    INDEX idx_currentHandlerId (currentHandlerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Complaint Messages table
CREATE TABLE IF NOT EXISTS complaint_messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    complaintId INT UNSIGNED NOT NULL,
    senderId INT UNSIGNED NOT NULL,
    receiverId INT UNSIGNED,
    message TEXT NOT NULL,
    messageType ENUM('comment', 'request_info', 'response') NOT NULL DEFAULT 'comment',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaintId (complaintId),
    INDEX idx_senderId (senderId),
    INDEX idx_receiverId (receiverId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Complaint Workflow table
CREATE TABLE IF NOT EXISTS complaint_workflow (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    complaintId INT UNSIGNED NOT NULL,
    fromRole VARCHAR(50),
    toRole VARCHAR(50),
    fromUserId INT UNSIGNED,
    toUserId INT UNSIGNED,
    action ENUM('submit', 'forward', 'approve', 'reject', 'request_info'),
    note TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (fromUserId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (toUserId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaintId (complaintId),
    INDEX idx_fromUserId (fromUserId),
    INDEX idx_toUserId (toUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Insert Initial Roles and Permissions
-- ==========================================
INSERT INTO roles (name, description) VALUES
('admin', 'System administrator with full access to the platform'),
('organizer', 'Member of the organizing committee responsible for managing competitions'),
('chief_referee', 'Chief referee overseeing all officiating activities and ensuring fair play'),
('referee', 'Match official responsible for officiating individual matches'),
('athlete', 'Registered athlete participating in the competition'),
('spectator', 'Spectator who can view competition information and results'),
('team_manager', 'Head of delegation responsible for managing a team'),
('coach', 'Coach responsible for training and supporting athletes');

-- ==========================================
-- Add User Constraints
-- ==========================================
ALTER TABLE users
ADD CONSTRAINT chk_email_format CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

-- ==========================================
-- Add Tournament Constraints
-- ==========================================
ALTER TABLE tournament_contents
ADD CONSTRAINT chk_numberOfSingles_Doubles CHECK (
    (type = 'single' AND numberOfSingles IS NULL AND numberOfDoubles IS NULL) OR
    (type = 'double' AND numberOfDoubles IS NULL AND numberOfSingles IS NULL) OR
    (type = 'team' AND numberOfSingles IS NOT NULL AND numberOfDoubles IS NOT NULL 
    AND NOT(numberOfSingles = 0 AND numberOfDoubles = 0) AND MOD(numberOfSingles+numberOfDoubles, 2) = 1 
    AND (numberOfSingles + numberOfDoubles) >= 3)
);

-- ==========================================
-- End of Initial Schema
