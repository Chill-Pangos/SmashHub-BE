-- V010: Create knockout_brackets table for tracking knockout stage bracket structure
-- This table stores the bracket tree structure for knockout tournaments

CREATE TABLE IF NOT EXISTS knockout_brackets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contentId INT UNSIGNED NOT NULL,
    
    -- Bracket position information
    roundNumber INT UNSIGNED NOT NULL COMMENT 'Round number: 1 (R64), 2 (R32), 3 (R16), 4 (QF), 5 (SF), 6 (F)',
    bracketPosition INT UNSIGNED NOT NULL COMMENT 'Position in the bracket (0-based index within round)',
    
    -- Match information
    scheduleId INT UNSIGNED COMMENT 'Reference to schedule if match has been created',
    matchId INT UNSIGNED COMMENT 'Reference to match if match has been created',
    
    -- Entries (teams/players)
    entryAId INT UNSIGNED COMMENT 'First entry in this bracket position',
    entryBId INT UNSIGNED COMMENT 'Second entry in this bracket position',
    winnerEntryId INT UNSIGNED COMMENT 'Winner of this match',
    
    -- Seeding information
    seedA INT UNSIGNED COMMENT 'Seed number for entry A',
    seedB INT UNSIGNED COMMENT 'Seed number for entry B',
    
    -- Navigation in bracket tree
    nextBracketId INT UNSIGNED COMMENT 'ID of the bracket position winner advances to',
    previousBracketAId INT UNSIGNED COMMENT 'ID of bracket that feeds into entry A position',
    previousBracketBId INT UNSIGNED COMMENT 'ID of bracket that feeds into entry B position',
    
    -- Status
    status ENUM('pending', 'ready', 'in_progress', 'completed') NOT NULL DEFAULT 'pending' COMMENT 'pending: waiting for entries, ready: both entries assigned, in_progress: match started, completed: match finished',
    
    -- Metadata
    roundName VARCHAR(50) COMMENT 'Human-readable round name (e.g., "Round of 16", "Quarter-final", "Semi-final", "Final")',
    isByeMatch BOOLEAN DEFAULT FALSE COMMENT 'True if one entry has a bye',
    
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contentId) REFERENCES tournament_contents(id) ON DELETE CASCADE,
    FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE SET NULL,
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE SET NULL,
    FOREIGN KEY (entryAId) REFERENCES entries(id) ON DELETE SET NULL,
    FOREIGN KEY (entryBId) REFERENCES entries(id) ON DELETE SET NULL,
    FOREIGN KEY (winnerEntryId) REFERENCES entries(id) ON DELETE SET NULL,
    FOREIGN KEY (nextBracketId) REFERENCES knockout_brackets(id) ON DELETE SET NULL,
    FOREIGN KEY (previousBracketAId) REFERENCES knockout_brackets(id) ON DELETE SET NULL,
    FOREIGN KEY (previousBracketBId) REFERENCES knockout_brackets(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_content_round_position (contentId, roundNumber, bracketPosition),
    INDEX idx_contentId (contentId),
    INDEX idx_round (roundNumber),
    INDEX idx_status (status),
    INDEX idx_nextBracket (nextBracketId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
