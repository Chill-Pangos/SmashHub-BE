-- V009: Create group_standings table for tracking team performance in group stage
-- This table stores statistics and rankings for each team in each group

CREATE TABLE IF NOT EXISTS group_standings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contentId INT UNSIGNED NOT NULL,
    groupName VARCHAR(50) NOT NULL,
    entryId INT UNSIGNED NOT NULL,
    
    -- Match statistics
    matchesPlayed INT UNSIGNED NOT NULL DEFAULT 0,
    matchesWon INT UNSIGNED NOT NULL DEFAULT 0,
    matchesLost INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Game/Set statistics
    setsWon INT UNSIGNED NOT NULL DEFAULT 0,
    setsLost INT UNSIGNED NOT NULL DEFAULT 0,
    setsDiff INT NOT NULL DEFAULT 0,
    
    -- Ranking
    position INT UNSIGNED COMMENT 'Current position in group',
    
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contentId) REFERENCES tournament_contents(id) ON DELETE CASCADE,
    FOREIGN KEY (entryId) REFERENCES entries(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_group_entry (contentId, groupName, entryId),
    INDEX idx_contentId_groupName (contentId, groupName),
    INDEX idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
