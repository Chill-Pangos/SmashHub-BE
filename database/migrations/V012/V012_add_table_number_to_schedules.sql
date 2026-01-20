-- Migration V012: Add tableNumber to schedules table
-- This tracks which table a match is assigned to

ALTER TABLE schedules 
ADD COLUMN tableNumber INT NULL 
COMMENT 'Table number for the match (1-N based on tournament.numberOfTables)';

-- Add index for querying by table
CREATE INDEX idx_schedules_table_number ON schedules(tableNumber);
