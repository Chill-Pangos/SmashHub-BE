-- SmashHub Database Schema
-- Version: V004
-- Description: Add teams and team_members tables for tournament team management

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournamentId INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
    INDEX idx_tournamentId (tournamentId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    teamId INT UNSIGNED NOT NULL,
    userId INT UNSIGNED NOT NULL,
    role ENUM('team_manager', 'coach', 'athlete') NOT NULL DEFAULT 'athlete',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_user (teamId, userId),
    INDEX idx_teamId (teamId),
    INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update entries table to add teamId foreign key and remove name column
ALTER TABLE entries 
DROP COLUMN name,
ADD COLUMN teamId INT UNSIGNED AFTER contentId,
ADD FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL,
ADD INDEX idx_teamId (teamId);

-- Update entry_members table to add eloAtEntry column
ALTER TABLE entry_members
ADD COLUMN eloAtEntry INT UNSIGNED NOT NULL DEFAULT 1000 AFTER userId;
