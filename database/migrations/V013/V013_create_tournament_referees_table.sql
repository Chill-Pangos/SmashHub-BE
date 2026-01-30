-- V013: Create tournament_referees table to manage referees for each tournament

CREATE TABLE IF NOT EXISTS tournament_referees (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournamentId INT UNSIGNED NOT NULL,
    refereeId INT UNSIGNED NOT NULL,
    role ENUM('main', 'assistant') NOT NULL DEFAULT 'assistant',
    isAvailable BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (refereeId) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure a referee is not added multiple times with the same role in the same tournament
    UNIQUE KEY unique_tournament_referee_role (tournamentId, refereeId, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for faster lookups
CREATE INDEX idx_tournament_referee ON tournament_referees(tournamentId, isAvailable);
CREATE INDEX idx_referee ON tournament_referees(refereeId);