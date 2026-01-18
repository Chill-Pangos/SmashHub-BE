# Database Seed Data

## Overview
File seed này tạo dữ liệu mẫu đầy đủ cho hệ thống SmashHub bao gồm:
- **301 users**: 1 admin, 100 athletes, 100 coaches, 100 referees
- **10 tournaments** với nhiều loại nội dung khác nhau
- **Đăng ký thi đấu** cho các tournament (singles, doubles, team)
- **Teams và team members** cho các giải đấu đồng đội

## Thông tin quan trọng

### Default Password
Tất cả tài khoản đều có password: `Password123!`

### User Accounts Structure
- **Admin**: `admin@smashhub.com`
- **Athletes**: `athlete001@smashhub.com` đến `athlete100@smashhub.com`
- **Coaches**: `coach001@smashhub.com` đến `coach100@smashhub.com`
- **Referees**: `referee001@smashhub.com` đến `referee100@smashhub.com`

## Cách chạy Seed Data

### 1. Backup Database (Khuyến nghị)
```bash
mysqldump -u your_username -p SMASHHUB_DB > backup_$(date +%Y%m%d).sql
```

### 2. Chạy Seed File
```bash
mysql -u your_username -p SMASHHUB_DB < database/seeds/seed_data.sql
```

Hoặc từ MySQL client:
```sql
USE SMASHHUB_DB;
SOURCE database/seeds/seed_data.sql;
```

### 3. Kiểm tra kết quả
```sql
-- Kiểm tra số lượng users
SELECT COUNT(*) as total_users FROM users;
-- Kết quả: 301

-- Kiểm tra phân bổ theo role
SELECT r.name, COUNT(ur.userId) as count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.roleId
GROUP BY r.name;

-- Kiểm tra tournaments
SELECT COUNT(*) as total_tournaments FROM tournaments;
-- Kết quả: 10

-- Kiểm tra tournament contents
SELECT t.name, COUNT(tc.id) as contents
FROM tournaments t
LEFT JOIN tournament_contents tc ON t.id = tc.tournamentId
GROUP BY t.id, t.name;

-- Kiểm tra entries
SELECT tc.name, COUNT(e.id) as entries
FROM tournament_contents tc
LEFT JOIN entries e ON tc.id = e.contentId
GROUP BY tc.id, tc.name;
```

## Chi tiết Tournaments

### Tournament 1: Spring Championship 2026
- **Địa điểm**: National Sports Center, Hanoi
- **Thời gian**: 15-20 March 2026
- **Nội dung**:
  - Men Singles (32 entries)
  - Women Singles (32 entries)
  - Men Doubles (16 entries)
  - Women Doubles (16 entries)
  - Mixed Doubles (16 entries)

### Tournament 2: Summer Open 2026
- **Địa điểm**: Olympic Stadium, Ho Chi Minh City
- **Thời gian**: 1-7 June 2026
- **Nội dung**:
  - Men Singles A (64 entries - ELO ≥ 1200)
  - Men Singles B (64 entries - ELO < 1200)
  - Women Singles (32 entries)
  - Mixed Doubles (32 entries)

### Tournament 3: National Cup 2026
- **Địa điểm**: Sports Complex, Da Nang
- **Thời gian**: 10-15 February 2026
- **Status**: Ongoing
- **Nội dung**:
  - Men Team (4 teams)
  - Women Team (3 teams)
  - Men Singles (32 entries)

### Tournament 4: Youth Tournament 2026
- **Địa điểm**: Youth Center, Hai Phong
- **Thời gian**: 20-25 April 2026
- **Nội dung**:
  - Boys U18 Singles (32 entries)
  - Girls U18 Singles (32 entries)
  - Boys U18 Doubles (16 entries)
  - Girls U18 Doubles (16 entries)

### Tournament 5: Masters Championship 2026
- **Địa điểm**: Grand Arena, Can Tho
- **Thời gian**: 10-16 July 2026
- **Nội dung**:
  - Men 35+ Singles (16 entries)
  - Men 45+ Singles (16 entries)
  - Women 35+ Singles (16 entries)

### Tournament 6: City League 2026
- **Địa điểm**: Municipal Hall, Hue
- **Thời gian**: 5-12 January 2026
- **Status**: Completed
- **Nội dung**:
  - Open Singles (32 entries)
  - Open Doubles (16 entries)

### Tournament 7: Regional Qualifier 2026
- **Địa điểm**: Regional Center, Nha Trang
- **Thời gian**: 1-5 May 2026
- **Nội dung**:
  - Men Singles Qualifier (64 entries)
  - Women Singles Qualifier (32 entries)

### Tournament 8: International Open 2026
- **Địa điểm**: International Arena, Hanoi
- **Thời gian**: 15-22 August 2026
- **Nội dung**:
  - Men Singles Pro (32 entries - ELO ≥ 1300)
  - Women Singles Pro (32 entries - ELO ≥ 1300)
  - Mixed Doubles Pro (16 entries)

### Tournament 9: Winter Championship 2026
- **Địa điểm**: Winter Complex, Dalat
- **Thời gian**: 10-17 November 2026
- **Nội dung**:
  - Men Singles (32 entries)
  - Women Singles (32 entries)
  - Men Doubles (16 entries)

### Tournament 10: Grand Slam Final 2026
- **Địa điểm**: Grand Stadium, Ho Chi Minh City
- **Thời gian**: 1-10 December 2026
- **Nội dung**:
  - Men Singles Championship (16 entries - ELO ≥ 1400)
  - Women Singles Championship (16 entries - ELO ≥ 1400)
  - Men Doubles Championship (8 entries)
  - Mixed Team Championship (3 teams)

## Teams Created

### Men Teams (Tournament 3)
1. **Thunder Eagles** - Hanoi (6 members: 5 athletes + 1 coach)
2. **Dragon Warriors** - Ho Chi Minh City (6 members)
3. **Phoenix Rising** - Da Nang (6 members)
4. **Storm Fighters** - Hai Phong (6 members)

### Women Teams (Tournament 3)
5. **Victory Queens** - Hanoi (6 members)
6. **Diamond Angels** - Ho Chi Minh City (6 members)
7. **Golden Stars** - Can Tho (6 members)

### Mixed Teams (Tournament 10)
8. **United Champions** (6 members)
9. **Supreme Masters** (6 members)
10. **Legends United** (6 members)

## ELO Scores
- Tất cả athletes đều có ELO score ngẫu nhiên từ 800-1400
- Được tạo sẵn trong bảng `elo_scores`

## Testing Accounts

### Admin Account
```
Email: admin@smashhub.com
Password: Password123!
```

### Athlete Accounts
```
Email: athlete001@smashhub.com to athlete100@smashhub.com
Password: Password123!
```

### Coach Accounts
```
Email: coach001@smashhub.com to coach100@smashhub.com
Password: Password123!
```

### Referee Accounts
```
Email: referee001@smashhub.com to referee100@smashhub.com
Password: Password123!
```

## Notes

1. **Gender Distribution**:
   - Athletes: Xen kẽ male/female
   - Coaches: Chủ yếu male, một số female
   - Referees: Chủ yếu male, một số female

2. **Entries**:
   - Singles: 1 athlete per entry
   - Doubles: 2 athletes per entry (same gender for Men/Women, mixed for Mixed)
   - Team: 5 athletes + 1 coach per team

3. **Tournament Contents**:
   - Có đủ các loại: single, double, team
   - Có nhiều điều kiện khác nhau: age restrictions, ELO restrictions, gender
   - Một số có group stage, một số knockout trực tiếp

4. **Data Cleaning**:
   - File seed tự động truncate (xóa) dữ liệu cũ trước khi insert
   - **Cẩn thận**: Việc này sẽ xóa toàn bộ dữ liệu hiện có!

## Troubleshooting

### Lỗi Foreign Key
Nếu gặp lỗi foreign key constraint:
```sql
SET FOREIGN_KEY_CHECKS=0;
-- Run your seed
SET FOREIGN_KEY_CHECKS=1;
```

### Reset hoàn toàn Database
```bash
# Drop và tạo lại database
mysql -u your_username -p -e "DROP DATABASE IF EXISTS SMASHHUB_DB;"
mysql -u your_username -p -e "CREATE DATABASE SMASHHUB_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Chạy lại migrations
mysql -u your_username -p SMASHHUB_DB < database/migrations/V001_init_schema.sql
mysql -u your_username -p SMASHHUB_DB < database/migrations/V002_add_gender_to_tournament_contents.sql
# ... các migrations khác

# Chạy seed
mysql -u your_username -p SMASHHUB_DB < database/seeds/seed_data.sql
```

## Support
Nếu có vấn đề, kiểm tra:
1. Database connection
2. User permissions (INSERT, UPDATE, DELETE, SELECT)
3. Migration files đã chạy chưa
4. Foreign key constraints

Happy Testing! 🏸
