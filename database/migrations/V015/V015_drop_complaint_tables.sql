-- Migration: V015
-- Description: Drop complaint_workflow, complaint_messages, and complaints tables
--              along with all their associated foreign keys and indexes.

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------
-- 1. Drop complaint_workflow
--    FKs: complaintId → complaints(id), fromUserId → users(id), toUserId → users(id)
--    Indexes: idx_complaintId, idx_fromUserId, idx_toUserId
-- -------------------------------------------------------
DROP TABLE IF EXISTS complaint_workflow;

-- -------------------------------------------------------
-- 2. Drop complaint_messages
--    FKs: complaintId → complaints(id), senderId → users(id), receiverId → users(id)
--    Indexes: idx_complaintId, idx_senderId, idx_receiverId
-- -------------------------------------------------------
DROP TABLE IF EXISTS complaint_messages;

-- -------------------------------------------------------
-- 3. Drop complaints
--    FKs: createdBy → users(id), tournamentId → tournaments(id),
--         matchId → matches(id), currentHandlerId → users(id)
--    Indexes: idx_createdBy, idx_tournamentId, idx_matchId,
--             idx_status, idx_currentHandlerId
-- -------------------------------------------------------
DROP TABLE IF EXISTS complaints;

SET FOREIGN_KEY_CHECKS = 1;
