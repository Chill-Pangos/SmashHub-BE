-- V008: Add stage and knockout round information to schedules table
-- This allows tracking group stage vs knockout stage matches

ALTER TABLE schedules
ADD COLUMN stage ENUM('group', 'knockout') DEFAULT 'group' AFTER groupName,
ADD COLUMN knockoutRound VARCHAR(50) AFTER stage COMMENT 'e.g., Round of 16, Quarter-final, Semi-final, Final',
ADD INDEX idx_stage (stage);
