-- SmashHub Database Seed Data
-- Description: Seed data for testing and development
-- Includes: 301 users (1 admin, 100 each for athlete, coach, referee roles)
--          10 tournaments with various content types (single, double, team)
--          Entries and registrations

SET FOREIGN_KEY_CHECKS=0;

-- ==========================================
-- Clear existing data (CAUTION: This will delete all data!)
-- ==========================================
TRUNCATE TABLE complaint_workflow;
TRUNCATE TABLE complaint_messages;
TRUNCATE TABLE complaints;
TRUNCATE TABLE elo_histories;
TRUNCATE TABLE elo_scores;
TRUNCATE TABLE match_sets;
TRUNCATE TABLE matches;
TRUNCATE TABLE schedules;
TRUNCATE TABLE entry_members;
TRUNCATE TABLE entries;
TRUNCATE TABLE team_members;
TRUNCATE TABLE teams;
TRUNCATE TABLE tournament_contents;
TRUNCATE TABLE tournaments;
TRUNCATE TABLE user_roles;
TRUNCATE TABLE otps;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE access_tokens;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS=1;

-- ==========================================
-- Seed Users Data
-- ==========================================
-- Password for all users: Password123!
-- Hashed with bcrypt: $2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G

-- Admin user (1)
INSERT INTO users (username, email, password, isEmailVerified, gender, avatarUrl, dob, phoneNumber) VALUES
('admin', 'admin@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=1', '1985-01-15', '+84901234567');

-- Athletes (100)
INSERT INTO users (username, email, password, isEmailVerified, gender, avatarUrl, dob, phoneNumber) VALUES
('athlete001', 'athlete001@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=11', '1995-03-20', '+84901234601'),
('athlete002', 'athlete002@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=12', '1996-05-12', '+84901234602'),
('athlete003', 'athlete003@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=13', '1994-07-08', '+84901234603'),
('athlete004', 'athlete004@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=14', '1997-02-18', '+84901234604'),
('athlete005', 'athlete005@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=15', '1993-09-25', '+84901234605'),
('athlete006', 'athlete006@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=16', '1998-11-03', '+84901234606'),
('athlete007', 'athlete007@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=17', '1995-04-14', '+84901234607'),
('athlete008', 'athlete008@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=18', '1996-06-21', '+84901234608'),
('athlete009', 'athlete009@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=19', '1994-08-30', '+84901234609'),
('athlete010', 'athlete010@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=20', '1997-10-05', '+84901234610'),
('athlete011', 'athlete011@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=21', '1995-12-11', '+84901234611'),
('athlete012', 'athlete012@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=22', '1996-01-19', '+84901234612'),
('athlete013', 'athlete013@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=23', '1994-03-27', '+84901234613'),
('athlete014', 'athlete014@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=24', '1997-05-06', '+84901234614'),
('athlete015', 'athlete015@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=25', '1995-07-13', '+84901234615'),
('athlete016', 'athlete016@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=26', '1996-09-22', '+84901234616'),
('athlete017', 'athlete017@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=27', '1994-11-29', '+84901234617'),
('athlete018', 'athlete018@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=28', '1997-01-08', '+84901234618'),
('athlete019', 'athlete019@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'male', 'https://i.pravatar.cc/150?img=29', '1995-03-16', '+84901234619'),
('athlete020', 'athlete020@smashhub.com', '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G', TRUE, 'female', 'https://i.pravatar.cc/150?img=30', '1996-05-24', '+84901234620');

-- Continue with more athletes (athlete021 to athlete100)
INSERT INTO users (username, email, password, isEmailVerified, gender, avatarUrl, dob, phoneNumber) 
SELECT 
    CONCAT('athlete', LPAD(n, 3, '0')),
    CONCAT('athlete', LPAD(n, 3, '0'), '@smashhub.com'),
    '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G',
    TRUE,
    IF(n % 2 = 0, 'female', 'male'),
    CONCAT('https://i.pravatar.cc/150?img=', (n % 70) + 1),
    DATE_ADD('1990-01-01', INTERVAL FLOOR(RAND() * 3650) DAY),
    CONCAT('+8490123', LPAD(n + 4600, 4, '0'))
FROM (
    SELECT 21 AS n UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
    SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
    SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
    SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
    SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
    SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
    SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
    SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90 UNION
    SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95 UNION
    SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100
) numbers;

-- Coaches (100)
INSERT INTO users (username, email, password, isEmailVerified, gender, avatarUrl, dob, phoneNumber)
SELECT 
    CONCAT('coach', LPAD(n, 3, '0')),
    CONCAT('coach', LPAD(n, 3, '0'), '@smashhub.com'),
    '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G',
    TRUE,
    IF(n % 3 = 0, 'female', 'male'),
    CONCAT('https://i.pravatar.cc/150?img=', (n % 70) + 1),
    DATE_ADD('1975-01-01', INTERVAL FLOOR(RAND() * 5475) DAY),
    CONCAT('+8490234', LPAD(n + 5000, 4, '0'))
FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
    SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
    SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
    SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
    SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
    SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
    SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
    SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90 UNION
    SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95 UNION
    SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100
) numbers;

-- Referees (100)
INSERT INTO users (username, email, password, isEmailVerified, gender, avatarUrl, dob, phoneNumber)
SELECT 
    CONCAT('referee', LPAD(n, 3, '0')),
    CONCAT('referee', LPAD(n, 3, '0'), '@smashhub.com'),
    '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G',
    TRUE,
    IF(n % 3 = 0, 'female', 'male'),
    CONCAT('https://i.pravatar.cc/150?img=', (n % 70) + 1),
    DATE_ADD('1975-01-01', INTERVAL FLOOR(RAND() * 7300) DAY),
    CONCAT('+8490345', LPAD(n + 6000, 4, '0'))
FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
    SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
    SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
    SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
    SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
    SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
    SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
    SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90 UNION
    SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95 UNION
    SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100
) numbers;

-- Organizers (100)
INSERT INTO users (username, email, password, isEmailVerified, gender, avatarUrl, dob, phoneNumber)
SELECT 
    CONCAT('organizer', LPAD(n, 3, '0')),
    CONCAT('organizer', LPAD(n, 3, '0'), '@smashhub.com'),
    '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G',
    TRUE,
    IF(n % 3 = 0, 'female', 'male'),
    CONCAT('https://i.pravatar.cc/150?img=', (n % 70) + 1),
    DATE_ADD('1980-01-01', INTERVAL FLOOR(RAND() * 5475) DAY),
    CONCAT('+8490456', LPAD(n + 7000, 4, '0'))
FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
    SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
    SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
    SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
    SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
    SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
    SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
    SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90 UNION
    SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95 UNION
    SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100
) numbers;

-- Chief Referees (100)
INSERT INTO users (username, email, password, isEmailVerified, gender, avatarUrl, dob, phoneNumber)
SELECT 
    CONCAT('chief_referee', LPAD(n, 3, '0')),
    CONCAT('chief_referee', LPAD(n, 3, '0'), '@smashhub.com'),
    '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G',
    TRUE,
    IF(n % 4 = 0, 'female', 'male'),
    CONCAT('https://i.pravatar.cc/150?img=', (n % 70) + 1),
    DATE_ADD('1975-01-01', INTERVAL FLOOR(RAND() * 7300) DAY),
    CONCAT('+8490567', LPAD(n + 8000, 4, '0'))
FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
    SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
    SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
    SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
    SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
    SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
    SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
    SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90 UNION
    SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95 UNION
    SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100
) numbers;

-- Team Managers (100)
INSERT INTO users (username, email, password, isEmailVerified, gender, avatarUrl, dob, phoneNumber)
SELECT 
    CONCAT('team_manager', LPAD(n, 3, '0')),
    CONCAT('team_manager', LPAD(n, 3, '0'), '@smashhub.com'),
    '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G',
    TRUE,
    IF(n % 3 = 0, 'female', 'male'),
    CONCAT('https://i.pravatar.cc/150?img=', (n % 70) + 1),
    DATE_ADD('1975-01-01', INTERVAL FLOOR(RAND() * 6575) DAY),
    CONCAT('+8490678', LPAD(n + 9000, 4, '0'))
FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
    SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
    SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
    SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
    SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
    SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
    SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
    SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90 UNION
    SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95 UNION
    SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100
) numbers;

-- Spectators (100)
INSERT INTO users (username, email, password, isEmailVerified, gender, avatarUrl, dob, phoneNumber)
SELECT 
    CONCAT('spectator', LPAD(n, 3, '0')),
    CONCAT('spectator', LPAD(n, 3, '0'), '@smashhub.com'),
    '$2a$10$rGZJ1PqVZPvYKGYYLXVXZe0F6WPWZ0L9pJxKmYN5oX3dLJGWCGH3G',
    TRUE,
    IF(n % 2 = 0, 'female', 'male'),
    CONCAT('https://i.pravatar.cc/150?img=', (n % 70) + 1),
    DATE_ADD('1985-01-01', INTERVAL FLOOR(RAND() * 10950) DAY),
    CONCAT('+8490789', LPAD(n + 10000, 4, '0'))
FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
    SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
    SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
    SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
    SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
    SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
    SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
    SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
    SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
    SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
    SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
    SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90 UNION
    SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95 UNION
    SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100
) numbers;

-- ==========================================
-- Assign Roles to Users
-- ==========================================
-- Admin role
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'admin';

-- Athlete role
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username LIKE 'athlete%' AND r.name = 'athlete';

-- Coach role
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username LIKE 'coach%' AND r.name = 'coach';

-- Referee role
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username LIKE 'referee%' AND r.name = 'referee';

-- Organizer role
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username LIKE 'organizer%' AND r.name = 'organizer';

-- Chief Referee role
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username LIKE 'chief_referee%' AND r.name = 'chief_referee';

-- Team Manager role
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username LIKE 'team_manager%' AND r.name = 'team_manager';

-- Spectator role
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username LIKE 'spectator%' AND r.name = 'spectator';

-- ==========================================
-- Create ELO Scores for Athletes
-- ==========================================
INSERT INTO elo_scores (userId, score)
SELECT id, FLOOR(800 + RAND() * 600)
FROM users
WHERE username LIKE 'athlete%';

-- ==========================================
-- Seed Tournaments Data (10 tournaments)
-- ==========================================
INSERT INTO tournaments (name, status, startDate, endDate, location, createdBy) VALUES
('Spring Championship 2026', 'upcoming', '2026-03-15 09:00:00', '2026-03-20 18:00:00', 'National Sports Center, Hanoi', 1),
('Summer Open 2026', 'upcoming', '2026-06-01 08:00:00', '2026-06-07 20:00:00', 'Olympic Stadium, Ho Chi Minh City', 1),
('National Cup 2026', 'ongoing', '2026-02-10 09:00:00', '2026-02-15 18:00:00', 'Sports Complex, Da Nang', 1),
('Youth Tournament 2026', 'upcoming', '2026-04-20 10:00:00', '2026-04-25 17:00:00', 'Youth Center, Hai Phong', 1),
('Masters Championship 2026', 'upcoming', '2026-07-10 09:00:00', '2026-07-16 19:00:00', 'Grand Arena, Can Tho', 1),
('City League 2026', 'completed', '2026-01-05 08:00:00', '2026-01-12 18:00:00', 'Municipal Hall, Hue', 1),
('Regional Qualifier 2026', 'upcoming', '2026-05-01 09:00:00', '2026-05-05 17:00:00', 'Regional Center, Nha Trang', 1),
('International Open 2026', 'upcoming', '2026-08-15 08:00:00', '2026-08-22 20:00:00', 'International Arena, Hanoi', 1),
('Winter Championship 2026', 'upcoming', '2026-11-10 09:00:00', '2026-11-17 18:00:00', 'Winter Complex, Dalat', 1),
('Grand Slam Final 2026', 'upcoming', '2026-12-01 10:00:00', '2026-12-10 19:00:00', 'Grand Stadium, Ho Chi Minh City', 1);

-- ==========================================
-- Seed Tournament Contents
-- ==========================================
-- Tournament 1: Spring Championship (Singles + Doubles + Team)
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(1, 'Men Singles', 'single', 32, 3, NULL, NULL, 16, 40, 800, NULL, 'male', TRUE, FALSE),
(1, 'Women Singles', 'single', 32, 3, NULL, NULL, 16, 40, 800, NULL, 'female', TRUE, FALSE),
(1, 'Men Doubles', 'double', 16, 3, NULL, NULL, 16, 40, NULL, NULL, 'male', TRUE, FALSE),
(1, 'Women Doubles', 'double', 16, 3, NULL, NULL, 16, 40, NULL, NULL, 'female', TRUE, FALSE),
(1, 'Mixed Doubles', 'double', 16, 3, NULL, NULL, 16, 40, NULL, NULL, 'mixed', TRUE, FALSE);

-- Tournament 2: Summer Open (All categories)
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(2, 'Men Singles A', 'single', 64, 5, NULL, NULL, 18, NULL, 1200, NULL, 'male', TRUE, TRUE),
(2, 'Men Singles B', 'single', 64, 3, NULL, NULL, 18, NULL, NULL, 1199, 'male', TRUE, TRUE),
(2, 'Women Singles', 'single', 32, 3, NULL, NULL, 18, NULL, NULL, NULL, 'female', TRUE, FALSE),
(2, 'Mixed Doubles', 'double', 32, 3, NULL, NULL, 18, NULL, NULL, NULL, 'mixed', TRUE, FALSE);

-- Tournament 3: National Cup (Team + Singles)
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(3, 'Men Team', 'team', 16, 3, 2, 1, 16, NULL, NULL, NULL, 'male', TRUE, TRUE),
(3, 'Women Team', 'team', 12, 3, 2, 1, 16, NULL, NULL, NULL, 'female', TRUE, TRUE),
(3, 'Men Singles', 'single', 32, 3, NULL, NULL, 16, NULL, NULL, NULL, 'male', TRUE, FALSE);

-- Tournament 4: Youth Tournament
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(4, 'Boys U18 Singles', 'single', 32, 3, NULL, NULL, NULL, 18, NULL, NULL, 'male', TRUE, FALSE),
(4, 'Girls U18 Singles', 'single', 32, 3, NULL, NULL, NULL, 18, NULL, NULL, 'female', TRUE, FALSE),
(4, 'Boys U18 Doubles', 'double', 16, 3, NULL, NULL, NULL, 18, NULL, NULL, 'male', TRUE, FALSE),
(4, 'Girls U18 Doubles', 'double', 16, 3, NULL, NULL, NULL, 18, NULL, NULL, 'female', TRUE, FALSE);

-- Tournament 5: Masters Championship
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(5, 'Men 35+ Singles', 'single', 16, 3, NULL, NULL, 35, NULL, NULL, NULL, 'male', TRUE, FALSE),
(5, 'Men 45+ Singles', 'single', 16, 3, NULL, NULL, 45, NULL, NULL, NULL, 'male', TRUE, FALSE),
(5, 'Women 35+ Singles', 'single', 16, 3, NULL, NULL, 35, NULL, NULL, NULL, 'female', TRUE, FALSE);

-- Tournament 6: City League
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(6, 'Open Singles', 'single', 32, 3, NULL, NULL, NULL, NULL, NULL, NULL, 'male', FALSE, FALSE),
(6, 'Open Doubles', 'double', 16, 3, NULL, NULL, NULL, NULL, NULL, NULL, 'mixed', FALSE, FALSE);

-- Tournament 7: Regional Qualifier
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(7, 'Men Singles Qualifier', 'single', 64, 3, NULL, NULL, 18, NULL, NULL, NULL, 'male', TRUE, TRUE),
(7, 'Women Singles Qualifier', 'single', 32, 3, NULL, NULL, 18, NULL, NULL, NULL, 'female', TRUE, TRUE);

-- Tournament 8: International Open
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(8, 'Men Singles Pro', 'single', 32, 5, NULL, NULL, 18, NULL, 1300, NULL, 'male', TRUE, FALSE),
(8, 'Women Singles Pro', 'single', 32, 5, NULL, NULL, 18, NULL, 1300, NULL, 'female', TRUE, FALSE),
(8, 'Mixed Doubles Pro', 'double', 16, 5, NULL, NULL, 18, NULL, NULL, NULL, 'mixed', TRUE, FALSE);

-- Tournament 9: Winter Championship
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(9, 'Men Singles', 'single', 32, 3, NULL, NULL, NULL, NULL, NULL, NULL, 'male', TRUE, FALSE),
(9, 'Women Singles', 'single', 32, 3, NULL, NULL, NULL, NULL, NULL, NULL, 'female', TRUE, FALSE),
(9, 'Men Doubles', 'double', 16, 3, NULL, NULL, NULL, NULL, NULL, NULL, 'male', TRUE, FALSE);

-- Tournament 10: Grand Slam Final
INSERT INTO tournament_contents (tournamentId, name, type, maxEntries, maxSets, numberOfSingles, numberOfDoubles, minAge, maxAge, minElo, maxElo, gender, racketCheck, isGroupStage) VALUES
(10, 'Men Singles Championship', 'single', 16, 5, NULL, NULL, NULL, NULL, 1400, NULL, 'male', TRUE, FALSE),
(10, 'Women Singles Championship', 'single', 16, 5, NULL, NULL, NULL, NULL, 1400, NULL, 'female', TRUE, FALSE),
(10, 'Men Doubles Championship', 'double', 8, 5, NULL, NULL, NULL, NULL, NULL, NULL, 'male', TRUE, FALSE),
(10, 'Mixed Team Championship', 'team', 8, 5, 2, 1, NULL, NULL, NULL, NULL, 'mixed', TRUE, TRUE);

-- ==========================================
-- Create Teams for Team Tournaments
-- ==========================================
-- Teams for Tournament 3: National Cup - Men Team
INSERT INTO teams (tournamentId, name, description) VALUES
(3, 'Thunder Eagles', 'Professional team from Hanoi'),
(3, 'Dragon Warriors', 'Elite team from Ho Chi Minh City'),
(3, 'Phoenix Rising', 'Strong team from Da Nang'),
(3, 'Storm Fighters', 'Competitive team from Hai Phong');

-- Teams for Tournament 3: National Cup - Women Team
INSERT INTO teams (tournamentId, name, description) VALUES
(3, 'Victory Queens', 'Top women team from Hanoi'),
(3, 'Diamond Angels', 'Professional women team from Ho Chi Minh City'),
(3, 'Golden Stars', 'Elite women team from Can Tho');

-- Teams for Tournament 10: Grand Slam - Mixed Team
INSERT INTO teams (tournamentId, name, description) VALUES
(10, 'United Champions', 'Mixed elite team'),
(10, 'Supreme Masters', 'Mixed professional team'),
(10, 'Legends United', 'Mixed veteran team');

-- ==========================================
-- Assign Team Members
-- ==========================================
-- Team 1: Thunder Eagles (Men)
INSERT INTO team_members (teamId, userId, role)
SELECT 1, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete001', 'athlete003', 'athlete005', 'athlete007', 'athlete009');

INSERT INTO team_members (teamId, userId, role)
SELECT 1, u.id, 'coach'
FROM users u
WHERE u.username = 'coach001';

-- Team 2: Dragon Warriors (Men)
INSERT INTO team_members (teamId, userId, role)
SELECT 2, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete011', 'athlete013', 'athlete015', 'athlete017', 'athlete019');

INSERT INTO team_members (teamId, userId, role)
SELECT 2, u.id, 'coach'
FROM users u
WHERE u.username = 'coach002';

-- Team 3: Phoenix Rising (Men)
INSERT INTO team_members (teamId, userId, role)
SELECT 3, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete021', 'athlete023', 'athlete025', 'athlete027', 'athlete029');

INSERT INTO team_members (teamId, userId, role)
SELECT 3, u.id, 'coach'
FROM users u
WHERE u.username = 'coach003';

-- Team 4: Storm Fighters (Men)
INSERT INTO team_members (teamId, userId, role)
SELECT 4, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete031', 'athlete033', 'athlete035', 'athlete037', 'athlete039');

INSERT INTO team_members (teamId, userId, role)
SELECT 4, u.id, 'coach'
FROM users u
WHERE u.username = 'coach004';

-- Team 5: Victory Queens (Women)
INSERT INTO team_members (teamId, userId, role)
SELECT 5, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete002', 'athlete004', 'athlete006', 'athlete008', 'athlete010');

INSERT INTO team_members (teamId, userId, role)
SELECT 5, u.id, 'coach'
FROM users u
WHERE u.username = 'coach005';

-- Team 6: Diamond Angels (Women)
INSERT INTO team_members (teamId, userId, role)
SELECT 6, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete012', 'athlete014', 'athlete016', 'athlete018', 'athlete020');

INSERT INTO team_members (teamId, userId, role)
SELECT 6, u.id, 'coach'
FROM users u
WHERE u.username = 'coach006';

-- Team 7: Golden Stars (Women)
INSERT INTO team_members (teamId, userId, role)
SELECT 7, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete022', 'athlete024', 'athlete026', 'athlete028', 'athlete030');

INSERT INTO team_members (teamId, userId, role)
SELECT 7, u.id, 'coach'
FROM users u
WHERE u.username = 'coach007';

-- Team 8: United Champions (Mixed)
INSERT INTO team_members (teamId, userId, role)
SELECT 8, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete041', 'athlete042', 'athlete043', 'athlete044', 'athlete045');

INSERT INTO team_members (teamId, userId, role)
SELECT 8, u.id, 'coach'
FROM users u
WHERE u.username = 'coach008';

-- Team 9: Supreme Masters (Mixed)
INSERT INTO team_members (teamId, userId, role)
SELECT 9, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete047', 'athlete048', 'athlete049', 'athlete050', 'athlete051');

INSERT INTO team_members (teamId, userId, role)
SELECT 9, u.id, 'coach'
FROM users u
WHERE u.username = 'coach009';

-- Team 10: Legends United (Mixed)
INSERT INTO team_members (teamId, userId, role)
SELECT 10, u.id, 'athlete'
FROM users u
WHERE u.username IN ('athlete053', 'athlete054', 'athlete055', 'athlete056', 'athlete057');

INSERT INTO team_members (teamId, userId, role)
SELECT 10, u.id, 'coach'
FROM users u
WHERE u.username = 'coach010';

-- ==========================================
-- Create Entries for Singles Tournaments
-- ==========================================
-- Tournament 1 - Men Singles (32 entries)
INSERT INTO entries (contentId, teamId)
SELECT 1, NULL FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32
) numbers;

-- Assign male athletes to Men Singles entries
INSERT INTO entry_members (entryId, userId, eloAtEntry)
SELECT 
    e.id,
    u.id,
    COALESCE(es.score, 1000)
FROM entries e
CROSS JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM users
    WHERE username LIKE 'athlete%' AND gender = 'male'
    LIMIT 32
) u
LEFT JOIN elo_scores es ON u.id = es.userId
WHERE e.contentId = 1 AND e.id - (SELECT MIN(id) FROM entries WHERE contentId = 1) + 1 = u.rn;

-- Tournament 1 - Women Singles (32 entries)
INSERT INTO entries (contentId, teamId)
SELECT 2, NULL FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
    SELECT 31 UNION SELECT 32
) numbers;

-- Assign female athletes to Women Singles entries
INSERT INTO entry_members (entryId, userId, eloAtEntry)
SELECT 
    e.id,
    u.id,
    COALESCE(es.score, 1000)
FROM entries e
CROSS JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM users
    WHERE username LIKE 'athlete%' AND gender = 'female'
    LIMIT 32
) u
LEFT JOIN elo_scores es ON u.id = es.userId
WHERE e.contentId = 2 AND e.id - (SELECT MIN(id) FROM entries WHERE contentId = 2) + 1 = u.rn;

-- ==========================================
-- Create Entries for Doubles Tournaments
-- ==========================================
-- Tournament 1 - Men Doubles (16 entries, 2 players each)
INSERT INTO entries (contentId, teamId)
SELECT 3, NULL FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16
) numbers;

-- Assign 2 male athletes per doubles entry
INSERT INTO entry_members (entryId, userId, eloAtEntry)
SELECT 
    base_entry_id + FLOOR((rn - 1) / 2),
    user_id,
    elo_score
FROM (
    SELECT 
        (SELECT MIN(id) FROM entries WHERE contentId = 3) as base_entry_id,
        u.id as user_id,
        COALESCE(es.score, 1000) as elo_score,
        ROW_NUMBER() OVER (ORDER BY u.id) as rn
    FROM users u
    LEFT JOIN elo_scores es ON u.id = es.userId
    WHERE u.username LIKE 'athlete%' AND u.gender = 'male'
    LIMIT 32
) numbered
WHERE rn <= 32;

-- Tournament 1 - Women Doubles (16 entries)
INSERT INTO entries (contentId, teamId)
SELECT 4, NULL FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16
) numbers;

-- Assign 2 female athletes per doubles entry
INSERT INTO entry_members (entryId, userId, eloAtEntry)
SELECT 
    base_entry_id + FLOOR((rn - 1) / 2),
    user_id,
    elo_score
FROM (
    SELECT 
        (SELECT MIN(id) FROM entries WHERE contentId = 4) as base_entry_id,
        u.id as user_id,
        COALESCE(es.score, 1000) as elo_score,
        ROW_NUMBER() OVER (ORDER BY u.id) as rn
    FROM users u
    LEFT JOIN elo_scores es ON u.id = es.userId
    WHERE u.username LIKE 'athlete%' AND u.gender = 'female'
    LIMIT 32
) numbered;

-- Tournament 1 - Mixed Doubles (16 entries, 1 male + 1 female)
INSERT INTO entries (contentId, teamId)
SELECT 5, NULL FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16
) numbers;

-- Assign 1 male + 1 female per mixed doubles entry
INSERT INTO entry_members (entryId, userId, eloAtEntry)
SELECT 
    base_entry_id + rn - 1,
    user_id,
    elo_score
FROM (
    SELECT 
        (SELECT MIN(id) FROM entries WHERE contentId = 5) as base_entry_id,
        u.id as user_id,
        COALESCE(es.score, 1000) as elo_score,
        ROW_NUMBER() OVER (ORDER BY u.id) as rn
    FROM users u
    LEFT JOIN elo_scores es ON u.id = es.userId
    WHERE u.username LIKE 'athlete%' AND u.gender = 'male'
    LIMIT 16
) numbered;

INSERT INTO entry_members (entryId, userId, eloAtEntry)
SELECT 
    base_entry_id + rn - 1,
    user_id,
    elo_score
FROM (
    SELECT 
        (SELECT MIN(id) FROM entries WHERE contentId = 5) as base_entry_id,
        u.id as user_id,
        COALESCE(es.score, 1000) as elo_score,
        ROW_NUMBER() OVER (ORDER BY u.id) as rn
    FROM users u
    LEFT JOIN elo_scores es ON u.id = es.userId
    WHERE u.username LIKE 'athlete%' AND u.gender = 'female'
    LIMIT 16
) numbered;

-- ==========================================
-- Create Entries for Team Tournaments
-- ==========================================
-- Tournament 3 - Men Team (using teams 1-4)
INSERT INTO entries (contentId, teamId) VALUES
(11, 1), -- Thunder Eagles
(11, 2), -- Dragon Warriors
(11, 3), -- Phoenix Rising
(11, 4); -- Storm Fighters

-- Tournament 3 - Women Team (using teams 5-7)
INSERT INTO entries (contentId, teamId) VALUES
(12, 5), -- Victory Queens
(12, 6), -- Diamond Angels
(12, 7); -- Golden Stars

-- Tournament 10 - Mixed Team (using teams 8-10)
INSERT INTO entries (contentId, teamId) VALUES
(43, 8),  -- United Champions
(43, 9),  -- Supreme Masters
(43, 10); -- Legends United

-- ==========================================
-- Seed Complete!
-- ==========================================
SELECT 'Seed data created successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_tournaments FROM tournaments;
SELECT COUNT(*) as total_contents FROM tournament_contents;
SELECT COUNT(*) as total_teams FROM teams;
SELECT COUNT(*) as total_entries FROM entries;
SELECT COUNT(*) as total_entry_members FROM entry_members;
