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
-- This file does not create users. It only creates tournament data and updates
-- selected existing user accounts with compatible gender/dob plus ELO scores.
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS seed_smashhub_tournaments $$
CREATE PROCEDURE seed_smashhub_tournaments()
BEGIN
  DECLARE done INT DEFAULT 0;

  DECLARE v_seed_no INT;
  DECLARE v_name VARCHAR(255);
  DECLARE v_status VARCHAR(32);
  DECLARE v_category_name VARCHAR(100);
  DECLARE v_type VARCHAR(16);
  DECLARE v_max_entries INT;
  DECLARE v_max_sets INT;
  DECLARE v_is_group TINYINT;
  DECLARE v_team_format VARCHAR(50);
  DECLARE v_max_members INT;
  DECLARE v_gender VARCHAR(16);
  DECLARE v_min_age INT;
  DECLARE v_max_age INT;
  DECLARE v_min_elo INT;
  DECLARE v_max_elo INT;
  DECLARE v_entry_fee DECIMAL(10,2);
  DECLARE v_eligible_entries INT;
  DECLARE v_ineligible_entries INT;
  DECLARE v_reg_start_hours INT;
  DECLARE v_reg_end_hours INT;
  DECLARE v_bracket_hours INT;
  DECLARE v_start_hours INT;
  DECLARE v_end_hours INT;
  DECLARE v_notes TEXT;

  DECLARE v_tournament_id INT;
  DECLARE v_category_id INT;
  DECLARE v_organizer_id INT DEFAULT 2;
  DECLARE v_chief_referee_id INT;
  DECLARE v_referee_id INT;
  DECLARE v_entry_idx INT;
  DECLARE v_member_idx INT;
  DECLARE v_total_entries INT;
  DECLARE v_required_members INT;
  DECLARE v_current_members INT;
  DECLARE v_entry_id INT;
  DECLARE v_user_no INT;
  DECLARE v_user_id INT;
  DECLARE v_member_gender VARCHAR(8);
  DECLARE v_elo INT;
  DECLARE v_is_eligible TINYINT;
  DECLARE v_is_confirmed TINYINT;
  DECLARE v_payment_case INT;

  DECLARE seed_cursor CURSOR FOR
    SELECT
      seedNo, name, status, categoryName, categoryType, maxEntries, maxSets,
      isGroupStage, teamFormat, maxMembersPerEntry, gender, minAge, maxAge,
      minElo, maxElo, entryFee, eligibleEntries, ineligibleEntries,
      regStartHours, regEndHours, bracketHours, startHours, endHours, notes
    FROM tmp_tournament_seeds
    ORDER BY seedNo;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

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
     18, 45, 800, 2400, 0, 16, 2, 48, 240, 288, 504, 552,
     'Upcoming + single + group stage + free. Contains eligible and unconfirmed entries.'),

    (2, 'Seed Tournament - Registration Open Double Knockout Paid', 'registration_open',
     'Mixed Doubles Knockout', 'double', 64, 7, 0, NULL, NULL, 'mixed',
     18, 60, 900, 2500, 150000, 32, 4, 48, 240, 288, 504, 552,
     'Registration open + double + knockout + paid. Covers completed and non-completed payments.'),

    (3, 'Seed Tournament - Registration Closed Team Group Paid', 'registration_closed',
     'Men Team League Group', 'team', 20, 5, 1, 'S-D-S', 6, 'male',
     18, 55, 700, 2600, 500000, 16, 2, 48, 240, 288, 504, 552,
     'Registration closed + team + group stage + paid + valid S-D-S format.'),

    (4, 'Seed Tournament - Brackets Generated Single Knockout', 'brackets_generated',
     'Women Singles Knockout', 'single', 32, 5, 0, NULL, NULL, 'female',
     NULL, NULL, NULL, NULL, 0, 32, 0, 72, 240, 288, 504, 552,
     'Brackets generated + single + knockout + female.'),

    (5, 'Seed Tournament - Ongoing Double Group Free', 'ongoing',
     'Women Doubles Group', 'double', 20, 5, 1, NULL, NULL, 'female',
     NULL, NULL, NULL, NULL, 0, 16, 0, 72, 240, 288, 504, 552,
     'Ongoing + double + group stage + free.'),

    (6, 'Seed Tournament - Completed Team Knockout Free', 'completed',
     'Open Team Cup Knockout', 'team', 32, 5, 0, 'S-S-D-S-S', 8, NULL,
     NULL, NULL, NULL, NULL, 0, 32, 0, 72, 240, 288, 504, 552,
     'Completed + team + knockout + unrestricted gender + valid five-match format.'),

    (7, 'Seed Tournament - Cancelled Single Group Insufficient', 'cancelled',
     'Cancelled Singles Group', 'single', 16, 5, 1, NULL, NULL, 'male',
     NULL, NULL, NULL, NULL, 0, 15, 0, 72, 240, 288, 504, 552,
     'Cancelled + insufficient eligible entries below cron minimum 16.'),

    (8, 'Seed Tournament - Registration Closed Double Paid Cancel Candidate', 'registration_closed',
     'Cancel Candidate Mixed Doubles', 'double', 32, 5, 0, NULL, NULL, 'mixed',
     NULL, NULL, NULL, NULL, 200000, 15, 3, 72, 240, 288, 504, 552,
     'Registration closed + paid + fewer than 16 eligible entries. Future bracket date keeps ScheduleConfig valid.'),

    (9, 'Seed Tournament - Upcoming Opening Soon', 'upcoming',
     'Opening Soon Singles', 'single', 16, 5, 1, NULL, NULL, NULL,
     NULL, NULL, NULL, NULL, 0, 16, 0, 12, 180, 228, 336, 384,
     'Upcoming notification case: registrationStartDate in next 24 hours.'),

    (10, 'Seed Tournament - Registration Open Closing Soon', 'registration_open',
     'Closing Soon Doubles', 'double', 20, 5, 1, NULL, NULL, 'mixed',
     NULL, NULL, NULL, NULL, 120000, 16, 2, 1, 12, 60, 132, 180,
     'Closing notification case: registrationEndDate in next 24 hours.'),

    (11, 'Seed Tournament - Registration Closed Brackets Soon', 'registration_closed',
     'Brackets Soon Team Knockout', 'team', 32, 5, 0, 'S-D-S', 6, 'female',
     NULL, NULL, NULL, NULL, 300000, 16, 2, 1, 6, 12, 84, 132,
     'Bracket notification case: bracketGenerationDate in next 24 hours.');

  DELETE FROM tournaments WHERE name LIKE 'Seed Tournament - %';

  INSERT INTO elo_scores (userId, score, createdAt, updatedAt)
  VALUES (v_organizer_id, 1400, NOW(), NOW())
  ON DUPLICATE KEY UPDATE score = VALUES(score), updatedAt = NOW();

  OPEN seed_cursor;

  seed_loop: LOOP
    FETCH seed_cursor INTO
      v_seed_no, v_name, v_status, v_category_name, v_type, v_max_entries,
      v_max_sets, v_is_group, v_team_format, v_max_members, v_gender,
      v_min_age, v_max_age, v_min_elo, v_max_elo, v_entry_fee,
      v_eligible_entries, v_ineligible_entries, v_reg_start_hours,
      v_reg_end_hours, v_bracket_hours, v_start_hours, v_end_hours, v_notes;

    IF done = 1 THEN
      LEAVE seed_loop;
    END IF;

    SET v_chief_referee_id = 353 + MOD(v_seed_no - 1, 50);
    SET v_referee_id = 203 + MOD(v_seed_no - 1, 150);

    INSERT INTO elo_scores (userId, score, createdAt, updatedAt)
    VALUES
      (v_chief_referee_id, 1450, NOW(), NOW()),
      (v_referee_id, 1350, NOW(), NOW())
    ON DUPLICATE KEY UPDATE score = VALUES(score), updatedAt = NOW();

    INSERT INTO tournaments (
      name, introduction, tier, status, location, createdBy, createdAt, updatedAt
    )
    VALUES (
      v_name, v_notes, ((v_seed_no - 1) % 5) + 1, v_status,
      CONCAT('Seed Court ', LPAD(v_seed_no, 2, '0')), v_organizer_id, NOW(), NOW()
    );
    SET v_tournament_id = LAST_INSERT_ID();

    INSERT INTO tournament_categories (
      tournamentId, name, type, maxEntries, maxSets, teamFormat,
      minAge, maxAge, minElo, maxElo, maxMembersPerEntry, gender,
      isGroupStage, entryFee, createdAt, updatedAt
    )
    VALUES (
      v_tournament_id, v_category_name, v_type, v_max_entries, v_max_sets,
      v_team_format, v_min_age, v_max_age, v_min_elo, v_max_elo,
      v_max_members, v_gender, v_is_group, v_entry_fee, NOW(), NOW()
    );
    SET v_category_id = LAST_INSERT_ID();

    INSERT INTO schedule_configs (
      tournamentId, startDate, endDate, numberOfTables,
      registrationStartDate, registrationEndDate, bracketGenerationDate,
      matchDurationMinutes, breakDurationMinutes, dailyStartHour,
      dailyStartMinute, dailyEndHour, dailyEndMinute,
      lunchBreakStartHour, lunchBreakStartMinute,
      lunchBreakEndHour, lunchBreakEndMinute, lunchBreakDurationMinutes,
      notes, createdAt, updatedAt
    )
    VALUES (
      v_tournament_id,
      DATE_ADD(NOW(), INTERVAL v_start_hours HOUR),
      DATE_ADD(NOW(), INTERVAL v_end_hours HOUR),
      8,
      DATE_ADD(NOW(), INTERVAL v_reg_start_hours HOUR),
      DATE_ADD(NOW(), INTERVAL v_reg_end_hours HOUR),
      DATE_ADD(NOW(), INTERVAL v_bracket_hours HOUR),
      45, 10, 8, 0, 22, 0, 12, 0, 13, 0, 60,
      'Generated by database/seed-tournaments.sql', NOW(), NOW()
    );

    INSERT INTO tournament_referees (
      tournamentId, refereeId, role, createdAt, updatedAt
    )
    VALUES
      (v_tournament_id, v_chief_referee_id, 'chief', NOW(), NOW()),
      (v_tournament_id, v_referee_id, 'referee', NOW(), NOW());

    SET v_required_members =
      CASE
        WHEN v_type = 'single' THEN 1
        WHEN v_type = 'double' THEN 2
        ELSE 3
      END;

    SET v_total_entries = v_eligible_entries + v_ineligible_entries;
    SET v_entry_idx = 1;

    entry_loop: WHILE v_entry_idx <= v_total_entries DO
      SET v_is_eligible = IF(v_entry_idx <= v_eligible_entries, 1, 0);
      SET v_is_confirmed = v_is_eligible;

      SET v_current_members =
        CASE
          WHEN v_is_eligible = 1 THEN v_required_members
          WHEN v_required_members = 1 THEN 1
          WHEN MOD(v_entry_idx, 2) = 0 THEN v_required_members - 1
          ELSE v_required_members
        END;

      SET v_member_idx = 1;

      member_loop: WHILE v_member_idx <= v_current_members DO
        SET v_member_gender =
          CASE
            WHEN v_gender = 'female' THEN 'female'
            WHEN v_gender = 'male' THEN 'male'
            WHEN v_gender = 'mixed' AND MOD(v_member_idx, 2) = 0 THEN 'female'
            WHEN v_gender = 'mixed' THEN 'male'
            WHEN MOD(v_entry_idx + v_member_idx, 2) = 0 THEN 'female'
            ELSE 'male'
          END;

        SET v_user_no =
          CASE
            WHEN v_member_gender = 'male'
              THEN (MOD(((v_seed_no - 1) * 140) + ((v_entry_idx - 1) * v_required_members) + v_member_idx - 1, 250) * 2) + 1
            ELSE (MOD(((v_seed_no - 1) * 140) + ((v_entry_idx - 1) * v_required_members) + v_member_idx - 1, 250) * 2) + 2
          END;

        SET v_user_id = IF(v_user_no <= 200, v_user_no + 2, v_user_no + 202);

        SET v_elo =
          CASE
            WHEN v_min_elo IS NOT NULL THEN v_min_elo + MOD(v_entry_idx * 13 + v_member_idx * 7, 300)
            ELSE 1200 + MOD(v_entry_idx * 11 + v_member_idx * 5, 700)
          END;

        IF v_max_elo IS NOT NULL AND v_elo > v_max_elo THEN
          SET v_elo = v_max_elo;
        END IF;

        UPDATE users
        SET
          gender = v_member_gender,
          dob = DATE_SUB(CURDATE(), INTERVAL 28 YEAR),
          updatedAt = NOW()
        WHERE id = v_user_id;

        INSERT INTO elo_scores (userId, score, createdAt, updatedAt)
        VALUES (v_user_id, v_elo, NOW(), NOW())
        ON DUPLICATE KEY UPDATE score = VALUES(score), updatedAt = NOW();

        IF v_member_idx = 1 THEN
          INSERT INTO entries (
            categoryId, captainId, name, isAcceptingMembers, requiredMemberCount,
            currentMemberCount, isConfirmed, confirmedAt, createdAt, updatedAt
          )
          VALUES (
            v_category_id,
            v_user_id,
            CONCAT(v_category_name, ' Entry ', LPAD(v_entry_idx, 2, '0')),
            IF(v_is_eligible = 1, 0, 1),
            v_required_members,
            v_current_members,
            v_is_confirmed,
            IF(v_is_confirmed = 1, NOW(), NULL),
            NOW(),
            NOW()
          );
          SET v_entry_id = LAST_INSERT_ID();
        END IF;

        INSERT INTO entry_members (
          entryId, userId, eloAtEntry, createdAt, updatedAt
        )
        VALUES (
          v_entry_id, v_user_id, v_elo, NOW(), NOW()
        );

        SET v_member_idx = v_member_idx + 1;
      END WHILE;

      IF v_entry_fee > 0 THEN
        SET v_payment_case = MOD(v_entry_idx, 4);

        IF v_is_eligible = 1 THEN
          IF v_payment_case = 0 THEN
            INSERT INTO payments (
              entryId, amount, method, status, confirmedBy, confirmedAt,
              createdAt, updatedAt
            )
            VALUES (
              v_entry_id, v_entry_fee, 'cash', 'completed',
              v_organizer_id, NOW(), NOW(), NOW()
            );
          ELSEIF v_payment_case = 1 THEN
            INSERT INTO payments (
              entryId, amount, method, status, proofImageUrl,
              confirmedBy, confirmedAt, createdAt, updatedAt
            )
            VALUES (
              v_entry_id, v_entry_fee, 'bank_transfer', 'completed',
              CONCAT('https://seed.smashhub.local/payments/t', v_seed_no, '/e', v_entry_idx, '.jpg'),
              v_organizer_id, NOW(), NOW(), NOW()
            );
          ELSE
            INSERT INTO payments (
              entryId, amount, method, status, transactionRef,
              createdAt, updatedAt
            )
            VALUES (
              v_entry_id, v_entry_fee, 'online', 'completed',
              CONCAT('SEED-T', v_seed_no, '-E', v_entry_idx),
              NOW(), NOW()
            );
          END IF;
        ELSE
          IF v_payment_case = 0 THEN
            INSERT INTO payments (
              entryId, amount, method, status, createdAt, updatedAt
            )
            VALUES (
              v_entry_id, v_entry_fee, 'cash', 'pending', NOW(), NOW()
            );
          ELSEIF v_payment_case = 1 THEN
            INSERT INTO payments (
              entryId, amount, method, status, proofImageUrl,
              createdAt, updatedAt
            )
            VALUES (
              v_entry_id, v_entry_fee, 'bank_transfer', 'pending',
              CONCAT('https://seed.smashhub.local/payments/pending-t', v_seed_no, '-e', v_entry_idx, '.jpg'),
              NOW(), NOW()
            );
          ELSEIF v_payment_case = 2 THEN
            INSERT INTO payments (
              entryId, amount, method, status, transactionRef,
              createdAt, updatedAt
            )
            VALUES (
              v_entry_id, v_entry_fee, 'online', 'failed',
              CONCAT('SEED-FAILED-T', v_seed_no, '-E', v_entry_idx),
              NOW(), NOW()
            );
          ELSE
            INSERT INTO payments (
              entryId, amount, method, status, refundedAt,
              createdAt, updatedAt
            )
            VALUES (
              v_entry_id, v_entry_fee, 'cash', 'refunded',
              NOW(), NOW(), NOW()
            );
          END IF;
        END IF;
      END IF;

      SET v_entry_idx = v_entry_idx + 1;
    END WHILE;
  END LOOP;

  CLOSE seed_cursor;
  DROP TEMPORARY TABLE IF EXISTS tmp_tournament_seeds;
END $$

DELIMITER ;

CALL seed_smashhub_tournaments();
DROP PROCEDURE IF EXISTS seed_smashhub_tournaments;
