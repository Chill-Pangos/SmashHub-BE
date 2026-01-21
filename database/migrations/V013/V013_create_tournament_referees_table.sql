-- V013: Create tournament_referees table to manage referees for each tournament

CREATE TABLE IF NOT EXISTS tournament_referees (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT UNSIGNED NOT NULL,
    referee_id INT UNSIGNED NOT NULL,
    role ENUM('main', 'assistant') NOT NULL DEFAULT 'main',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure a referee is not added multiple times with the same role in the same tournament
    UNIQUE KEY unique_tournament_referee_role (tournament_id, referee_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for faster lookups
CREATE INDEX idx_tournament_referee ON tournament_referees(tournament_id, is_available);
CREATE INDEX idx_referee ON tournament_referees(referee_id);
