-- Migration V011: Add numberOfTables to tournaments table
-- This allows tournaments to specify how many tables are available for concurrent matches

ALTER TABLE tournaments 
ADD COLUMN numberOfTables INT NOT NULL DEFAULT 1 
COMMENT 'Number of tables available for concurrent matches';

-- Add check constraint to ensure positive number
ALTER TABLE tournaments 
ADD CONSTRAINT chk_number_of_tables_positive 
CHECK (numberOfTables > 0);
