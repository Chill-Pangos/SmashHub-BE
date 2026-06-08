-- Migration: fix join_requests unique constraint + add type column
-- Up

-- 1. Xóa unique index cũ trên (entryId, userId)
DROP INDEX join_requests_entry_id_user_id ON join_requests;

-- 2. Thêm column type
ALTER TABLE join_requests
  ADD COLUMN type ENUM('requested', 'invited') NOT NULL DEFAULT 'requested'
  COMMENT 'requested = user tự xin vào, invited = captain mời';

-- 3. Thêm generated column: = userId nếu pending, NULL nếu không
ALTER TABLE join_requests
  ADD COLUMN pending_user_key INT UNSIGNED AS (
    CASE WHEN status = 'pending' THEN userId ELSE NULL END
  ) VIRTUAL;

-- 4. Unique index trên (entryId, pendingUserKey)
--    NULL bị bỏ qua → chỉ block duplicate khi cả 2 đều pending
CREATE UNIQUE INDEX join_requests_entry_user_pending_unique
  ON join_requests (entryId, pending_user_key);