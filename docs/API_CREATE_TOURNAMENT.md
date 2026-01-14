# 📘 API Documentation - Tạo Tournament

## **Endpoint**

```
POST /api/tournaments
```

## **Authentication**

✅ **Required** - Cần Bearer Token trong header

```
Authorization: Bearer <your_access_token>
```

## **Description**

API này tạo một tournament mới kèm theo các tournament contents (nếu có) trong một transaction duy nhất. User ID của người tạo sẽ được tự động lấy từ token authentication.

---

## **Request Body**

### **Required Fields (Bắt buộc):**

| Field       | Type              | Description                 | Example                      |
| ----------- | ----------------- | --------------------------- | ---------------------------- |
| `name`      | string            | Tên của tournament          | `"Spring Championship 2026"` |
| `startDate` | string (ISO 8601) | Ngày giờ bắt đầu tournament | `"2026-03-15T09:00:00Z"`     |
| `location`  | string            | Địa điểm tổ chức            | `"National Stadium"`         |

### **Optional Fields (Tùy chọn):**

| Field      | Type              | Description                       | Example                  | Default      |
| ---------- | ----------------- | --------------------------------- | ------------------------ | ------------ |
| `endDate`  | string (ISO 8601) | Ngày giờ kết thúc tournament      | `"2026-03-20T18:00:00Z"` | `null`       |
| `status`   | enum string       | Trạng thái tournament             | `"upcoming"`             | `"upcoming"` |
| `contents` | array             | Danh sách các tournament contents | Xem bên dưới             | `[]`         |

### **Enum Values:**

**`status` - Các giá trị có thể chọn:**

- ✅ `"upcoming"` - Sắp diễn ra (mặc định)
- ✅ `"ongoing"` - Đang diễn ra
- ✅ `"completed"` - Đã kết thúc

---

## **Tournament Contents Structure (trong array `contents`)**

Mỗi item trong array `contents` có cấu trúc:

### **Required Fields:**

| Field         | Type        | Description                        | Example           |
| ------------- | ----------- | ---------------------------------- | ----------------- |
| `name`        | string      | Tên của nội dung thi đấu           | `"Men's Singles"` |
| `type`        | enum string | Loại hình thi đấu                  | `"single"`        |
| `maxEntries`  | integer     | Số lượng tối đa người/đội tham gia | `32`              |
| `maxSets`     | integer     | Số lượng set tối đa mỗi trận       | `3`               |
| `racketCheck` | boolean     | Có kiểm tra vợt hay không          | `true`            |

### **Optional Fields:**

| Field             | Type        | Description                                                            | Example  |
| ----------------- | ----------- | ---------------------------------------------------------------------- | -------- |
| `numberOfSingles` | integer     | **CHỈ dùng cho type="team"**. Số trận đánh đơn trong thể thức đồng đội | `4`      |
| `numberOfDoubles` | integer     | **CHỈ dùng cho type="team"**. Số trận đánh đôi trong thể thức đồng đội | `1`      |
| `minAge`          | integer     | Giới hạn tuổi tối thiểu để tham gia                                    | `18`     |
| `maxAge`          | integer     | Giới hạn tuổi tối đa để tham gia                                       | `35`     |
| `minElo`          | integer     | Điểm ELO tối thiểu để tham gia                                         | `1200`   |
| `maxElo`          | integer     | Điểm ELO tối đa để tham gia                                            | `2000`   |
| `gender`          | enum string | Giới tính được phép tham gia                                           | `"male"` |
| `isGroupStage`    | boolean     | Có vòng bảng hay không                                                 | `false`  |

### **Enum Values:**

**`type` - Các giá trị có thể chọn:**

- ✅ `"single"` - Đơn (đánh đơn)
- ✅ `"team"` - Đội (thể thức đồng đội)
- ✅ `"double"` - Đôi (đánh đôi)

**`gender` - Các giá trị có thể chọn:**

- ✅ `"male"` - Nam
- ✅ `"female"` - Nữ
- ✅ `"mixed"` - Hỗn hợp (nam và nữ)

### **Validation Rules cho Tournament Contents:**

#### **Khi `type = "team"` (Thể thức đồng đội):**

1. **PHẢI có** `numberOfSingles` và `numberOfDoubles`
2. Tổng `numberOfSingles + numberOfDoubles` **phải >= 3**
3. Tổng `numberOfSingles + numberOfDoubles` **phải là số lẻ** (3, 5, 7, 9...)
4. Thể thức đồng đội thường là:
   - **4 trận đơn + 1 trận đôi** (tổng = 5)
   - **5 trận đơn + 0 trận đôi** (tổng = 5)
   - **3 trận đơn + 0 trận đôi** (tổng = 3)
5. Đội nào thắng **hơn một nửa số trận** (ví dụ: 3/5 trận) sẽ chiến thắng
6. `maxEntries` = số đội tham gia (không phải số người)

#### **Khi `type = "single"` hoặc `type = "double"`:**

1. **KHÔNG được** gửi `numberOfSingles` và `numberOfDoubles` (hoặc để `null`)
2. `maxEntries` = số người/cặp đôi tham gia

### **Điều kiện tham gia (Optional Filters):**

#### **Giới hạn tuổi:**

- Có thể set `minAge` và/hoặc `maxAge` để giới hạn độ tuổi người tham gia
- Ví dụ: U18 (`maxAge: 18`), U21 (`maxAge: 21`), Senior (`minAge: 40`)
- Nếu không set, không có giới hạn tuổi

#### **Giới hạn ELO Rating:**

- Có thể set `minElo` và/hoặc `maxElo` để phân hạng theo trình độ
- Ví dụ: Beginner (`maxElo: 1400`), Intermediate (`minElo: 1400, maxElo: 1800`), Advanced (`minElo: 1800`)
- Nếu không set, không có giới hạn ELO

#### **Giới tính:**

- Set `gender` để xác định giới tính được phép tham gia
- `"male"`: Chỉ nam
- `"female"`: Chỉ nữ
- `"mixed"`: Nam và nữ đều được (hoặc không set)
- Nếu không set, mặc định là mixed

---

## **Request Examples**

### **Example 1: Tournament đầy đủ với nhiều contents**

```json
{
  "name": "Spring Championship 2026",
  "startDate": "2026-03-15T09:00:00Z",
  "endDate": "2026-03-20T18:00:00Z",
  "location": "National Stadium",
  "status": "upcoming",
  "contents": [
    {
      "name": "Men's Singles U21",
      "type": "single",
      "maxEntries": 32,
      "maxSets": 3,
      "minAge": 15,
      "maxAge": 21,
      "gender": "male",
      "racketCheck": true,
      "isGroupStage": false
    },
    {
      "name": "Women's Doubles - Intermediate",
      "type": "double",
      "maxEntries": 16,
      "maxSets": 3,
      "minElo": 1400,
      "maxElo": 1800,
      "gender": "female",
      "racketCheck": true,
      "isGroupStage": false
    },
    {
      "name": "Men's Team",
      "type": "team",
      "maxEntries": 8,
      "maxSets": 3,
      "numberOfSingles": 4,
      "numberOfDoubles": 1,
      "racketCheck": true,
      "isGroupStage": true
    }
  ]
}
```

### **Example 2: Tournament thể thức đồng đội (Team Format)**

```json
{
  "name": "National Team Championship 2026",
  "startDate": "2026-05-10T08:00:00Z",
  "location": "Sports Complex Hall 1",
  "contents": [
    {
      "name": "Men's Team Competition",
      "type": "team",
      "maxEntries": 12,
      "maxSets": 5,
      "numberOfSingles": 4,
      "numberOfDoubles": 1,
      "racketCheck": true,
      "isGroupStage": true
    }
  ]
}
```

### **Example 3: Tournament tối thiểu (không có contents)**

```json
{
  "name": "Local Tournament 2026",
  "startDate": "2026-04-01T10:00:00Z",
  "location": "Community Center"
}
```

### **Example 4: Các thể thức team khác nhau**

```json
{
  "name": "Regional Team Battle 2026",
  "startDate": "2026-06-01T09:00:00Z",
  "endDate": null,
  "location": "Regional Stadium",
  "contents": [
    {
      "name": "Team Format - 5 Singles",
      "type": "team",
      "maxEntries": 16,
      "maxSets": 3,
      "numberOfSingles": 5,
      "numberOfDoubles": 0,
      "racketCheck": true
    },
    {
      "name": "Team Format - 3 Singles",
      "type": "team",
      "maxEntries": 16,
      "maxSets": 3,
      "numberOfSingles": 3,
      "numberOfDoubles": 0,
      "racketCheck": false
    }
  ]
}
```

### **Example 5: Tournament với điều kiện tham gia**

```json
{
  "name": "Youth Championship 2026",
  "startDate": "2026-07-15T09:00:00Z",
  "endDate": "2026-07-20T18:00:00Z",
  "location": "Youth Sports Center",
  "contents": [
    {
      "name": "Boys U18 Singles - Beginner",
      "type": "single",
      "maxEntries": 32,
      "maxSets": 3,
      "minAge": 12,
      "maxAge": 18,
      "maxElo": 1400,
      "gender": "male",
      "racketCheck": true,
      "isGroupStage": true
    },
    {
      "name": "Girls U18 Singles - Advanced",
      "type": "single",
      "maxEntries": 24,
      "maxSets": 5,
      "minAge": 12,
      "maxAge": 18,
      "minElo": 1800,
      "gender": "female",
      "racketCheck": true,
      "isGroupStage": false
    },
    {
      "name": "Mixed Doubles - Open Age",
      "type": "double",
      "maxEntries": 16,
      "maxSets": 3,
      "gender": "mixed",
      "racketCheck": false
    }
  ]
}
```

---

## **Response**

### **Success Response - 201 Created**

```json
{
  "id": 1,
  "name": "Spring Championship 2026",
  "startDate": "2026-03-15T09:00:00Z",
  "endDate": "2026-03-20T18:00:00Z",
  "location": "National Stadium",
  "status": "upcoming",
  "createdBy": 1,
  "createdAt": "2026-01-14T10:00:00Z",
  "updatedAt": "2026-01-14T10:00:00Z",
  "contents": [
    {
      "id": 1,
      "tournamentId": 1,
      "name": "Men's Singles",
      "type": "single",
      "maxEntries": 32,
      "maxSets": 3,
      "numberOfSingles": null,
      "numberOfDoubles": null,
      "minAge": null,
      "maxAge": null,
      "minElo": null,
      "maxElo": null,
      "gender": "mixed",
      "racketCheck": true,
      "isGroupStage": false,
      "createdAt": "2026-01-14T10:00:00Z",
      "updatedAt": "2026-01-14T10:00:00Z"
    }
  ]
}
```

### **Error Responses**

**400 Bad Request** - Dữ liệu đầu vào không hợp lệ

```json
{
  "message": "Error creating tournament",
  "error": {
    "details": "Validation error details"
  }
}
```

**401 Unauthorized** - Chưa đăng nhập hoặc token không hợp lệ

```json
{
  "message": "Unauthorized"
}
```

---

## **Important Notes cho Frontend:**

### **1. Date Format**

- Luôn sử dụng ISO 8601 format cho `startDate` và `endDate` (e.g., `"2026-03-15T09:00:00Z"`)
- `endDate` có thể để `null` hoặc không gửi nếu chưa xác định

### **2. Authentication & Auto-filled Fields**

- ✅ **PHẢI** gửi Bearer Token trong header
- ❌ **KHÔNG** gửi field `createdBy` trong request body
- Server sẽ **tự động lưu** user ID từ token authentication vào field `createdBy`

### **3. Transaction Behavior**

- Nếu có lỗi khi tạo bất kỳ tournament content nào, toàn bộ transaction sẽ **rollback**
- Tournament sẽ **không được tạo** nếu có lỗi ở bất kỳ content nào

### **4. Contents Array**

- Có thể để rỗng `[]` hoặc không gửi field này nếu chưa có contents
- Mỗi content phải tuân thủ validation rules theo `type`

### **5. Status Default**

- Nếu không gửi `status`, mặc định sẽ là `"upcoming"`

### **6. Enum Validation**

- Phải sử dụng **chính xác** các giá trị enum đã liệt kê
- Viết thường, không viết hoa hay thêm ký tự

### **7. Required vs Optional**

- **Tournament**: 3 field bắt buộc (`name`, `startDate`, `location`)
- **Contents**: 5 field bắt buộc (`name`, `type`, `maxEntries`, `maxSets`, `racketCheck`)

### **8. ⚠️ QUAN TRỌNG - Validation cho Type "team"**

**Frontend PHẢI validate:**

```javascript
// Pseudo code cho validation
if (content.type === "team") {
  // PHẢI có cả 2 trường
  if (!content.numberOfSingles || !content.numberOfDoubles) {
    throw Error("numberOfSingles và numberOfDoubles là bắt buộc cho type team");
  }

  const total = content.numberOfSingles + content.numberOfDoubles;

  // Tổng phải >= 3
  if (total < 3) {
    throw Error("Tổng số trận (numberOfSingles + numberOfDoubles) phải >= 3");
  }

  // Tổng phải là số lẻ
  if (total % 2 === 0) {
    throw Error("Tổng số trận phải là số lẻ (3, 5, 7, 9...)");
  }

  // maxEntries là số đội
  console.log(`Có ${content.maxEntries} đội tham gia`);
} else if (content.type === "single" || content.type === "double") {
  // KHÔNG được có 2 trường này
  content.numberOfSingles = null;
  content.numberOfDoubles = null;

  // maxEntries là số người/cặp đôi
  console.log(`Có ${content.maxEntries} người/cặp đôi tham gia`);
}
```

### **9. Điều kiện tham gia (Entry Filters)**

**Các trường optional để giới hạn người/đội có thể đăng ký:**

#### **Giới hạn tuổi (Age Restrictions):**

```javascript
// Có thể set một hoặc cả hai
content.minAge = 18; // Tối thiểu 18 tuổi
content.maxAge = 35; // Tối đa 35 tuổi

// Hoặc không set nếu không có giới hạn
content.minAge = null;
content.maxAge = null;
```

#### **Giới hạn ELO (Skill Level Restrictions):**

```javascript
// Phân hạng theo trình độ
content.minElo = 1400; // Cần ít nhất 1400 ELO
content.maxElo = 1800; // Không quá 1800 ELO

// Hoặc không set nếu không có giới hạn
content.minElo = null;
content.maxElo = null;
```

#### **Giới tính (Gender Restrictions):**

```javascript
// Chỉ định giới tính được phép
content.gender = "male"; // Chỉ nam
content.gender = "female"; // Chỉ nữ
content.gender = "mixed"; // Nam và nữ đều được

// Hoặc không set (mặc định là mixed)
content.gender = null; // = mixed
```

### **10. Giải thích Thể thức Team**

- Một trận đấu team gồm nhiều trận nhỏ (singles + doubles)
- Đội nào **thắng hơn một nửa số trận** sẽ chiến thắng
  - Ví dụ: Tổng 5 trận → thắng 3 trận = WIN
  - Ví dụ: Tổng 3 trận → thắng 2 trận = WIN
- Thể thức phổ biến:
  - **4 singles + 1 doubles** (tổng 5)
  - **5 singles + 0 doubles** (tổng 5)
  - **3 singles + 0 doubles** (tổng 3)

---

## **TypeScript Interface Reference**

```typescript
// Tournament DTOs
interface CreateTournamentDto {
  name: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  status?: "upcoming" | "ongoing" | "completed";
  contents?: CreateTournamentContentDto[];
}

interface CreateTournamentContentDto {
  name: string;
  type: "single" | "team" | "double";
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number; // CHỈ cho type="team"
  numberOfDoubles?: number; // CHỈ cho type="team"
  minAge?: number; // Tuổi tối thiểu
  maxAge?: number; // Tuổi tối đa
  minElo?: number; // ELO tối thiểu
  maxElo?: number; // ELO tối đa
  gender?: "male" | "female" | "mixed"; // Giới tính
  racketCheck: boolean;
  isGroupStage?: boolean;
}

interface TournamentResponseDto {
  id: number;
  name: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  contents?: TournamentContentResponseDto[];
}

interface TournamentContentResponseDto {
  id: number;
  tournamentId: number;
  name: string;
  type: "single" | "team" | "double";
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;
  gender?: "male" | "female" | "mixed";
  racketCheck: boolean;
  isGroupStage?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
