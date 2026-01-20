-- Rollback V008: Remove stage and knockout round information from schedules table

ALTER TABLE schedules
DROP INDEX idx_stage,
DROP COLUMN knockoutRound,
DROP COLUMN stage;
