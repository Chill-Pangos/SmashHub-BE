-- ============================================================================
-- SmashHub tournament seed data
-- Uses users seeded by database/migrations/002-seed-default-data.sql.
--
-- Required migration-002 user ranges:
-- - organizer: id 2
-- - user accounts: 3-202 and 403-702 (500 accounts)
-- - referee accounts: 203-352 and 703-1052 (500 accounts)
-- - chief_referee accounts: 353-402 and 1053-1502 (500 accounts)
--
-- No stored procedure here. MariaDB instances with an out-of-date mysql.proc
-- table can fail on DROP/CREATE PROCEDURE before data seeding starts.
-- ============================================================================

DROP TEMPORARY TABLE IF EXISTS tmp_tournament_seeds;
DROP TEMPORARY TABLE IF EXISTS tmp_numbers;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_entries;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_members;

CREATE TEMPORARY TABLE tmp_tournament_seeds (
  seedNo INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  categoryName VARCHAR(100) NOT NULL,
  categoryType VARCHAR(16) NOT NULL,
  maxEntries INT NOT NULL,
  maxSets INT NOT NULL,
  isGroupStage TINYINT(1) NOT NULL,
  teamFormat VARCHAR(50) NULL,
  maxMembersPerEntry INT NULL,
  gender VARCHAR(16) NULL,
  minAge INT NULL,
  maxAge INT NULL,
  minElo INT NULL,
  maxElo INT NULL,
  entryFee DECIMAL(10,2) NOT NULL DEFAULT 0,
  eligibleEntries INT NOT NULL,
  ineligibleEntries INT NOT NULL DEFAULT 0,
  userStartNo INT NOT NULL,
  regStartHours INT NOT NULL,
  regEndHours INT NOT NULL,
  bracketHours INT NOT NULL,
  startHours INT NOT NULL,
  endHours INT NOT NULL,
  notes TEXT NULL
);

INSERT INTO tmp_tournament_seeds VALUES
  (1, 'Seed Tournament - Upcoming Single Group Free', 'upcoming',
   'Men Singles Group', 'single', 20, 5, 1, NULL, NULL, 'male',
   18, 45, 800, 2400, 0, 16, 2, 1, 48, 240, 288, 504, 552,
   'Upcoming + single + group stage + free. Contains eligible and unconfirmed entries.'),

  (2, 'Seed Tournament - Registration Open Double Knockout Paid', 'registration_open',
   'Mixed Doubles Knockout', 'double', 64, 7, 0, NULL, NULL, 'mixed',
   18, 60, 900, 2500, 150000, 32, 4, 19, 48, 240, 288, 504, 552,
   'Registration open + double + knockout + paid. Covers completed and non-completed payments.'),

  (3, 'Seed Tournament - Registration Closed Team Group Paid', 'registration_closed',
   'Men Team League Group', 'team', 20, 5, 1, 'S-D-S', 6, 'male',
   18, 55, 700, 2600, 500000, 16, 2, 91, 48, 240, 288, 504, 552,
   'Registration closed + team + group stage + paid + valid S-D-S format.'),

  (4, 'Seed Tournament - Brackets Generated Single Knockout', 'brackets_generated',
   'Women Singles Knockout', 'single', 32, 5, 0, NULL, NULL, 'female',
   NULL, NULL, NULL, NULL, 0, 32, 0, 145, 72, 240, 288, 504, 552,
   'Brackets generated + single + knockout + female.'),

  (5, 'Seed Tournament - Ongoing Double Group Free', 'ongoing',
   'Women Doubles Group', 'double', 20, 5, 1, NULL, NULL, 'female',
   NULL, NULL, NULL, NULL, 0, 16, 0, 177, 72, 240, 288, 504, 552,
   'Ongoing + double + group stage + free.'),

  (6, 'Seed Tournament - Completed Team Knockout Free', 'completed',
   'Open Team Cup Knockout', 'team', 32, 5, 0, 'S-S-D-S-S', 8, NULL,
   NULL, NULL, NULL, NULL, 0, 32, 0, 209, 72, 240, 288, 504, 552,
   'Completed + team + knockout + unrestricted gender + valid five-match format.'),

  (7, 'Seed Tournament - Cancelled Single Group Insufficient', 'cancelled',
   'Cancelled Singles Group', 'single', 16, 5, 1, NULL, NULL, 'male',
   NULL, NULL, NULL, NULL, 0, 15, 0, 305, 72, 240, 288, 504, 552,
   'Cancelled + insufficient eligible entries below cron minimum 16.'),

  (8, 'Seed Tournament - Registration Closed Double Paid Cancel Candidate', 'registration_closed',
   'Cancel Candidate Mixed Doubles', 'double', 32, 5, 0, NULL, NULL, 'mixed',
   NULL, NULL, NULL, NULL, 200000, 15, 3, 320, 72, 240, 288, 504, 552,
   'Registration closed + paid + fewer than 16 eligible entries. Future bracket date keeps ScheduleConfig valid.'),

  (9, 'Seed Tournament - Upcoming Opening Soon', 'upcoming',
   'Opening Soon Singles', 'single', 16, 5, 1, NULL, NULL, NULL,
   NULL, NULL, NULL, NULL, 0, 16, 0, 356, 12, 180, 228, 336, 384,
   'Upcoming notification case: registrationStartDate in next 24 hours.'),

  (10, 'Seed Tournament - Registration Open Closing Soon', 'registration_open',
   'Closing Soon Doubles', 'double', 20, 5, 1, NULL, NULL, 'mixed',
   NULL, NULL, NULL, NULL, 120000, 16, 2, 372, 1, 12, 60, 132, 180,
   'Closing notification case: registrationEndDate in next 24 hours.'),

  (11, 'Seed Tournament - Registration Closed Brackets Soon', 'registration_closed',
   'Brackets Soon Team Knockout', 'team', 32, 5, 0, 'S-D-S', 6, 'female',
   NULL, NULL, NULL, NULL, 300000, 16, 2, 408, 1, 6, 12, 84, 132,
   'Bracket notification case: bracketGenerationDate in next 24 hours.');

CREATE TEMPORARY TABLE tmp_numbers (n INT PRIMARY KEY);

INSERT INTO tmp_numbers
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 100
)
SELECT n FROM seq;

DELETE FROM tournaments WHERE name LIKE 'Seed Tournament - %';

INSERT INTO elo_scores (userId, score, createdAt, updatedAt)
VALUES (2, 1400, NOW(), NOW())
ON DUPLICATE KEY UPDATE score = VALUES(score), updatedAt = NOW();

INSERT INTO tournaments (
  name, introduction, tier, status, location, createdBy, createdAt, updatedAt
)
SELECT
  name,
  notes,
  ((seedNo - 1) % 5) + 1,
  status,
  CONCAT('Seed Court ', LPAD(seedNo, 2, '0')),
  2,
  NOW(),
  NOW()
FROM tmp_tournament_seeds
ORDER BY seedNo;

INSERT INTO tournament_categories (
  tournamentId, name, type, maxEntries, maxSets, teamFormat,
  minAge, maxAge, minElo, maxElo, maxMembersPerEntry, gender,
  isGroupStage, entryFee, createdAt, updatedAt
)
SELECT
  t.id,
  s.categoryName,
  s.categoryType,
  s.maxEntries,
  s.maxSets,
  s.teamFormat,
  s.minAge,
  s.maxAge,
  s.minElo,
  s.maxElo,
  s.maxMembersPerEntry,
  s.gender,
  s.isGroupStage,
  s.entryFee,
  NOW(),
  NOW()
FROM tmp_tournament_seeds s
JOIN tournaments t ON t.name = s.name
ORDER BY s.seedNo;

INSERT INTO schedule_configs (
  tournamentId, startDate, endDate, numberOfTables,
  registrationStartDate, registrationEndDate, bracketGenerationDate,
  matchDurationMinutes, breakDurationMinutes, dailyStartHour,
  dailyStartMinute, dailyEndHour, dailyEndMinute,
  lunchBreakStartHour, lunchBreakStartMinute,
  lunchBreakEndHour, lunchBreakEndMinute, lunchBreakDurationMinutes,
  notes, createdAt, updatedAt
)
SELECT
  t.id,
  DATE_ADD(NOW(), INTERVAL s.startHours HOUR),
  DATE_ADD(NOW(), INTERVAL s.endHours HOUR),
  8,
  DATE_ADD(NOW(), INTERVAL s.regStartHours HOUR),
  DATE_ADD(NOW(), INTERVAL s.regEndHours HOUR),
  DATE_ADD(NOW(), INTERVAL s.bracketHours HOUR),
  45,
  10,
  8,
  0,
  22,
  0,
  12,
  0,
  13,
  0,
  60,
  'Generated by database/seed-tournaments.sql',
  NOW(),
  NOW()
FROM tmp_tournament_seeds s
JOIN tournaments t ON t.name = s.name
ORDER BY s.seedNo;

INSERT INTO tournament_referees (
  tournamentId, refereeId, role, createdAt, updatedAt
)
SELECT
  t.id,
  353 + MOD(s.seedNo - 1, 50),
  'chief',
  NOW(),
  NOW()
FROM tmp_tournament_seeds s
JOIN tournaments t ON t.name = s.name
UNION ALL
SELECT
  t.id,
  203 + MOD(s.seedNo - 1, 150),
  'referee',
  NOW(),
  NOW()
FROM tmp_tournament_seeds s
JOIN tournaments t ON t.name = s.name;

INSERT INTO elo_scores (userId, score, createdAt, updatedAt)
SELECT refereeId, IF(role = 'chief', 1450, 1350), NOW(), NOW()
FROM tournament_referees tr
JOIN tournaments t ON t.id = tr.tournamentId
WHERE t.name LIKE 'Seed Tournament - %'
ON DUPLICATE KEY UPDATE score = VALUES(score), updatedAt = NOW();

CREATE TEMPORARY TABLE tmp_seed_entries AS
SELECT
  s.seedNo,
  c.id AS categoryId,
  s.categoryName,
  s.categoryType,
  s.gender,
  s.minElo,
  s.maxElo,
  s.entryFee,
  s.userStartNo,
  n.n AS entryIdx,
  CASE
    WHEN s.categoryType = 'single' THEN 1
    WHEN s.categoryType = 'double' THEN 2
    ELSE 3
  END AS requiredMembers,
  IF(n.n <= s.eligibleEntries, 1, 0) AS isEligible,
  CASE
    WHEN n.n <= s.eligibleEntries THEN
      CASE
        WHEN s.categoryType = 'single' THEN 1
        WHEN s.categoryType = 'double' THEN 2
        ELSE 3
      END
    WHEN s.categoryType = 'single' THEN 1
    WHEN MOD(n.n, 2) = 0 THEN
      CASE
        WHEN s.categoryType = 'double' THEN 1
        ELSE 2
      END
    ELSE
      CASE
        WHEN s.categoryType = 'double' THEN 2
        ELSE 3
      END
  END AS currentMembers
FROM tmp_tournament_seeds s
JOIN tournaments t ON t.name = s.name
JOIN tournament_categories c ON c.tournamentId = t.id
JOIN tmp_numbers n ON n.n <= s.eligibleEntries + s.ineligibleEntries;

CREATE TEMPORARY TABLE tmp_seed_members AS
SELECT
  e.seedNo,
  e.categoryId,
  e.categoryName,
  e.categoryType,
  e.gender AS categoryGender,
  e.minElo,
  e.maxElo,
  e.entryFee,
  e.entryIdx,
  e.requiredMembers,
  e.currentMembers,
  e.isEligible,
  m.n AS memberIdx,
  CASE
    WHEN e.gender = 'female' THEN 'female'
    WHEN e.gender = 'male' THEN 'male'
    WHEN e.gender = 'mixed' AND MOD(m.n, 2) = 0 THEN 'female'
    WHEN e.gender = 'mixed' THEN 'male'
    WHEN MOD(e.entryIdx + m.n, 2) = 0 THEN 'female'
    ELSE 'male'
  END AS memberGender,
  e.userStartNo + ((e.entryIdx - 1) * e.requiredMembers) + m.n - 1 AS userNo,
  IF(
    e.userStartNo + ((e.entryIdx - 1) * e.requiredMembers) + m.n - 1 <= 200,
    e.userStartNo + ((e.entryIdx - 1) * e.requiredMembers) + m.n + 1,
    e.userStartNo + ((e.entryIdx - 1) * e.requiredMembers) + m.n + 201
  ) AS userId,
  CASE
    WHEN e.minElo IS NOT NULL THEN
      LEAST(
        COALESCE(e.maxElo, e.minElo + 300),
        e.minElo + MOD(e.entryIdx * 13 + m.n * 7, 300)
      )
    ELSE 1200 + MOD(e.entryIdx * 11 + m.n * 5, 700)
  END AS elo
FROM tmp_seed_entries e
JOIN tmp_numbers m ON m.n <= e.currentMembers;

UPDATE users u
JOIN (
  SELECT userId, memberGender
  FROM tmp_seed_members
  GROUP BY userId, memberGender
) sm ON sm.userId = u.id
SET
  u.gender = sm.memberGender,
  u.dob = DATE_SUB(CURDATE(), INTERVAL 28 YEAR),
  u.updatedAt = NOW();

INSERT INTO elo_scores (userId, score, createdAt, updatedAt)
SELECT userId, MAX(elo), NOW(), NOW()
FROM tmp_seed_members
GROUP BY userId
ON DUPLICATE KEY UPDATE score = VALUES(score), updatedAt = NOW();

INSERT INTO entries (
  categoryId, captainId, name, isAcceptingMembers, requiredMemberCount,
  currentMemberCount, isConfirmed, confirmedAt, createdAt, updatedAt
)
SELECT
  e.categoryId,
  sm.userId,
  CONCAT(e.categoryName, ' Entry ', LPAD(e.entryIdx, 2, '0')),
  IF(e.isEligible = 1, 0, 1),
  e.requiredMembers,
  e.currentMembers,
  e.isEligible,
  IF(e.isEligible = 1, NOW(), NULL),
  NOW(),
  NOW()
FROM tmp_seed_entries e
JOIN tmp_seed_members sm
  ON sm.categoryId = e.categoryId
 AND sm.entryIdx = e.entryIdx
 AND sm.memberIdx = 1
ORDER BY e.seedNo, e.entryIdx;

INSERT INTO entry_members (
  entryId, userId, eloAtEntry, createdAt, updatedAt
)
SELECT
  e.id,
  sm.userId,
  sm.elo,
  NOW(),
  NOW()
FROM tmp_seed_members sm
JOIN entries e
  ON e.categoryId = sm.categoryId
 AND e.name = CONCAT(sm.categoryName, ' Entry ', LPAD(sm.entryIdx, 2, '0'))
ORDER BY sm.seedNo, sm.entryIdx, sm.memberIdx;

INSERT INTO payments (
  entryId, amount, method, status, confirmedBy, confirmedAt,
  proofImageUrl, transactionRef, refundedAt, createdAt, updatedAt
)
SELECT
  e.id,
  se.entryFee,
  CASE
    WHEN se.isEligible = 1 AND MOD(se.entryIdx, 4) = 0 THEN 'cash'
    WHEN se.isEligible = 1 AND MOD(se.entryIdx, 4) = 1 THEN 'bank_transfer'
    WHEN se.isEligible = 1 THEN 'online'
    WHEN MOD(se.entryIdx, 4) = 0 THEN 'cash'
    WHEN MOD(se.entryIdx, 4) = 1 THEN 'bank_transfer'
    WHEN MOD(se.entryIdx, 4) = 2 THEN 'online'
    ELSE 'cash'
  END,
  CASE
    WHEN se.isEligible = 1 THEN 'completed'
    WHEN MOD(se.entryIdx, 4) = 2 THEN 'failed'
    WHEN MOD(se.entryIdx, 4) = 3 THEN 'refunded'
    ELSE 'pending'
  END,
  CASE
    WHEN se.isEligible = 1 AND MOD(se.entryIdx, 4) IN (0, 1) THEN 2
    ELSE NULL
  END,
  CASE
    WHEN se.isEligible = 1 AND MOD(se.entryIdx, 4) IN (0, 1) THEN NOW()
    ELSE NULL
  END,
  CASE
    WHEN MOD(se.entryIdx, 4) = 1 THEN
      CONCAT('https://seed.smashhub.local/payments/t', se.seedNo, '/e', se.entryIdx, '.jpg')
    ELSE NULL
  END,
  CASE
    WHEN MOD(se.entryIdx, 4) = 2 THEN CONCAT('SEED-T', se.seedNo, '-E', se.entryIdx)
    ELSE NULL
  END,
  CASE
    WHEN se.isEligible = 0 AND MOD(se.entryIdx, 4) = 3 THEN NOW()
    ELSE NULL
  END,
  NOW(),
  NOW()
FROM tmp_seed_entries se
JOIN entries e
  ON e.categoryId = se.categoryId
 AND e.name = CONCAT(se.categoryName, ' Entry ', LPAD(se.entryIdx, 2, '0'))
WHERE se.entryFee > 0
ORDER BY se.seedNo, se.entryIdx;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_members;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_entries;
DROP TEMPORARY TABLE IF EXISTS tmp_numbers;
DROP TEMPORARY TABLE IF EXISTS tmp_tournament_seeds;
