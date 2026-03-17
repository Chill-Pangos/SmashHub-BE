-- Rollback: V015
-- Description: Re-create complaint_workflow, complaint_messages, and complaints tables.

CREATE TABLE IF NOT EXISTS complaints (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    createdBy INT UNSIGNED NOT NULL,
    tournamentId INT UNSIGNED NOT NULL,
    matchId INT UNSIGNED,
    topic VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('submitted', 'under_review', 'escalated', 'resolved', 'rejected') NOT NULL DEFAULT 'submitted',
    currentHandlerId INT UNSIGNED,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE SET NULL,
    FOREIGN KEY (currentHandlerId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_createdBy (createdBy),
    INDEX idx_tournamentId (tournamentId),
    INDEX idx_matchId (matchId),
    INDEX idx_status (status),
    INDEX idx_currentHandlerId (currentHandlerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaint_messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    complaintId INT UNSIGNED NOT NULL,
    senderId INT UNSIGNED NOT NULL,
    receiverId INT UNSIGNED,
    message TEXT NOT NULL,
    messageType ENUM('comment', 'request_info', 'response') NOT NULL DEFAULT 'comment',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaintId (complaintId),
    INDEX idx_senderId (senderId),
    INDEX idx_receiverId (receiverId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaint_workflow (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    complaintId INT UNSIGNED NOT NULL,
    fromRole VARCHAR(50),
    toRole VARCHAR(50),
    fromUserId INT UNSIGNED,
    toUserId INT UNSIGNED,
    action ENUM('submit', 'forward', 'approve', 'reject', 'request_info'),
    note TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (fromUserId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (toUserId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaintId (complaintId),
    INDEX idx_fromUserId (fromUserId),
    INDEX idx_toUserId (toUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
