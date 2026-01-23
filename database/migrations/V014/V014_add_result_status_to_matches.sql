-- V014: Add result_status and review_notes columns to matches table for approval workflow

ALTER TABLE matches
ADD COLUMN result_status ENUM('pending', 'approved', 'rejected') NULL 
    COMMENT 'Status of match result approval by chief referee' AFTER is_confirmed_by_winner;

ALTER TABLE matches
ADD COLUMN review_notes TEXT NULL 
    COMMENT 'Review notes from chief referee' AFTER result_status;

-- Add index for result_status for efficient queries
CREATE INDEX idx_matches_result_status ON matches(result_status);
