# 📘 API Documentation - Match Set Operations

Tài liệu này mô tả các API để **quản lý match sets (các set trong trận đấu)** trong tournaments.

> 📝 **Lưu ý quan trọng:**
>
> - Match Set dùng để lưu **điểm tổng kết của từng set**
> - **KHÔNG** cập nhật điểm real-time từng ball
> - Mỗi set có `setNumber` (1, 2, 3...)
> - Điểm format: `entryAScore` vs `entryBScore` (ví dụ: 11-5, 11-9)

---

## **Table of Contents**

1. [Create Match Set](#1-create-match-set)
2. [Get All Match Sets](#2-get-all-match-sets)
3. [Get Match Set by ID](#3-get-match-set-by-id)
4. [Get Match Sets by Match ID](#4-get-match-sets-by-match-id)
5. [Create Match Set with Score (Recommended)](#5-create-match-set-with-score-recommended)
6. [Update Match Set](#6-update-match-set)
7. [Delete Match Set](#7-delete-match-set)

---

## **1. Create Match Set**

### **Endpoint**

```
POST /api/match-sets
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication trong production)

### **Description**

Tạo một match set mới để lưu **điểm tổng kết** của một set trong trận đấu.

**Khi nào sử dụng:**

- Sau khi **hoàn tất một set** trong trận đấu
- Lưu điểm cuối cùng của set (ví dụ: 11-5, 11-9, 12-10)
- Không dùng để update điểm real-time

### **Request Body**

#### **Required Fields:**

| Field         | Type    | Description                | Example |
| ------------- | ------- | -------------------------- | ------- |
| `matchId`     | integer | ID của match               | `1`     |
| `setNumber`   | integer | Số thứ tự set (1, 2, 3...) | `1`     |
| `entryAScore` | integer | Điểm của entry A           | `11`    |
| `entryBScore` | integer | Điểm của entry B           | `5`     |

### **Request Example**

```json
{
  "matchId": 1,
  "setNumber": 1,
  "entryAScore": 11,
  "entryBScore": 5
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "matchId": 1,
  "setNumber": 1,
  "entryAScore": 11,
  "entryBScore": 5,
  "createdAt": "2026-01-20T10:30:00.000Z",
  "updatedAt": "2026-01-20T10:30:00.000Z"
}
```

### **Error Responses**

```json
{
  "message": "Error creating match set",
  "error": {}
}
```

---

## **2. Get All Match Sets**

### **Endpoint**

```
GET /api/match-sets
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tất cả match sets.

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/match-sets?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "matchId": 1,
    "setNumber": 1,
    "entryAScore": 11,
    "entryBScore": 5,
    "createdAt": "2026-01-20T10:30:00.000Z",
    "updatedAt": "2026-01-20T10:30:00.000Z"
  },
  {
    "id": 2,
    "matchId": 1,
    "setNumber": 2,
    "entryAScore": 11,
    "entryBScore": 9,
    "createdAt": "2026-01-20T10:45:00.000Z",
    "updatedAt": "2026-01-20T10:45:00.000Z"
  }
]
```

### **Error Responses**

```json
{
  "message": "Error fetching match sets",
  "error": {}
}
```

---

## **3. Get Match Set by ID**

### **Endpoint**

```
GET /api/match-sets/{id}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin chi tiết của một match set theo ID.

### **Path Parameters**

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Match Set ID |

### **Request Example**

```http
GET /api/match-sets/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "matchId": 1,
  "setNumber": 1,
  "entryAScore": 11,
  "entryBScore": 5,
  "createdAt": "2026-01-20T10:30:00.000Z",
  "updatedAt": "2026-01-20T10:30:00.000Z"
}
```

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Match set not found"
}
```

---

## **4. Get Match Sets by Match ID**

### **Endpoint**

```
GET /api/match-sets/match/{matchId}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy tất cả sets của một match cụ thể, được sắp xếp theo `setNumber` tăng dần.

**Use case chính:**

- Hiển thị lịch sử các sets trong một trận đấu
- Tính toán winner dựa trên số sets thắng
- Hiển thị score board chi tiết

### **Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `matchId` | integer | Yes      | Match ID    |

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/match-sets/match/1?skip=0&limit=10
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "matchId": 1,
    "setNumber": 1,
    "entryAScore": 11,
    "entryBScore": 5,
    "createdAt": "2026-01-20T10:30:00.000Z",
    "updatedAt": "2026-01-20T10:30:00.000Z"
  },
  {
    "id": 2,
    "matchId": 1,
    "setNumber": 2,
    "entryAScore": 11,
    "entryBScore": 9,
    "createdAt": "2026-01-20T10:45:00.000Z",
    "updatedAt": "2026-01-20T10:45:00.000Z"
  },
  {
    "id": 3,
    "matchId": 1,
    "setNumber": 3,
    "entryAScore": 9,
    "entryBScore": 11,
    "createdAt": "2026-01-20T11:00:00.000Z",
    "updatedAt": "2026-01-20T11:00:00.000Z"
  }
]
```

**Giải thích kết quả:**

- Entry A thắng set 1: 11-5
- Entry A thắng set 2: 11-9
- Entry B thắng set 3: 11-9
- **Kết quả:** Entry A thắng 2-1

---

## **5. Create Match Set with Score (Recommended)**

### **Endpoint**

```
POST /api/match-sets/score
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

🎯 **API KHUYẾN KHÍCH SỬ DỤNG** - Tạo match set mới với điểm tổng kết và **tự động validate** theo quy tắc cầu lông:

**Quy tắc validate:**
1. **Phải có người thắng** - không thể hòa
2. **Đạt 11 điểm trước thắng** nếu đối phương < 10
3. **Từ 10-10 phải hơn 2 điểm** (ví dụ: 12-10, 13-11, 14-12...)
4. **Không giới hạn điểm tối đa** khi deuce (có thể 30-28, 50-48...)
5. Điểm không được âm

**Lợi ích:**
- ✅ Không cần truyền `setNumber` - tự động tính
- ✅ Validate điểm theo luật cầu lông
- ✅ Đảm bảo kết quả hợp lệ
- ✅ Tránh lỗi người dùng nhập sai

### **Request Body**

| Field         | Type    | Required | Description                | Example |
| ------------- | ------- | -------- | -------------------------- | ------- |
| `matchId`     | integer | Yes      | ID của match               | `1`     |
| `entryAScore` | integer | Yes      | Điểm cuối cùng của entry A | `11`    |
| `entryBScore` | integer | Yes      | Điểm cuối cùng của entry B | `9`     |

### **Request Example**

**Scenario 1: Set thắng thông thường (11-9)**

```json
{
  "matchId": 1,
  "entryAScore": 11,
  "entryBScore": 9
}
```

**Scenario 2: Set deuce (12-10)**

```json
{
  "matchId": 1,
  "entryAScore": 12,
  "entryBScore": 10
}
```

**Scenario 3: Set deuce kéo dài (30-28)**

```json
{
  "matchId": 1,
  "entryAScore": 30,
  "entryBScore": 28
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "matchId": 1,
  "setNumber": 1,
  "entryAScore": 11,
  "entryBScore": 9,
  "createdAt": "2026-01-20T10:30:00.000Z",
  "updatedAt": "2026-01-20T10:30:00.000Z"
}
```

**Note:** `setNumber` được tự động tính từ số sets hiện có + 1

### **Error Responses**

**400 Bad Request - Chưa có người thắng**

```json
{
  "message": "Invalid score: Must have a winner. Current score: 9-7"
}
```

**400 Bad Request - Chưa đạt 11 điểm**

```json
{
  "message": "Invalid score: No one reached 11 points yet. Current score: 10-8"
}
```

**400 Bad Request - Deuce chưa hơn 2 điểm**

```json
{
  "message": "Invalid score: From 10-10, must win by 2 points. Current score: 11-10"
}
```

**400 Bad Request - Điểm âm**

```json
{
  "message": "Invalid score: Scores cannot be negative"
}
```

---

## **6. Update Match Set**

### **Endpoint**

```
PUT /api/match-sets/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Cập nhật điểm của một match set (thường dùng để sửa lỗi nhập liệu).

### **Path Parameters**

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Match Set ID |

### **Request Body**

Tất cả fields đều **optional** - chỉ gửi những gì cần update.

| Field         | Type    | Description      | Example |
| ------------- | ------- | ---------------- | ------- |
| `entryAScore` | integer | Điểm của entry A | `11`    |
| `entryBScore` | integer | Điểm của entry B | `8`     |

### **Request Example**

```json
{
  "entryAScore": 11,
  "entryBScore": 8
}
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "matchId": 1,
  "setNumber": 1,
  "entryAScore": 11,
  "entryBScore": 8,
  "createdAt": "2026-01-20T10:30:00.000Z",
  "updatedAt": "2026-01-20T11:15:00.000Z"
}
```

### **Error Responses**

**400 Bad Request**

```json
{
  "message": "Error updating match set",
  "error": {}
}
```

**404 Not Found**

```json
{
  "message": "Match set not found"
}
```

---

## **7. Delete Match Set**

### **Endpoint**

```
DELETE /api/match-sets/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Xóa một match set (thường dùng khi nhập nhầm hoặc hủy set).

### **Path Parameters**

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Match Set ID |

### **Request Example**

```http
DELETE /api/match-sets/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Response - 204 No Content**

Không có response body. Status code 204 nghĩa là xóa thành công.

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Match set not found"
}
```

---

## **Important Notes cho Frontend**

### **1. Workflow Nhập Điểm (Recommended)**

✅ **Sử dụng API /match-sets/score (Khuyến khích):**

```javascript
// Sau mỗi set kết thúc, nhập điểm
POST /api/match-sets/score
{
  "matchId": 1,
  "entryAScore": 11,
  "entryBScore": 5
}
// ✅ Auto validate theo luật cầu lông
// ✅ Auto tính setNumber
// ✅ Đảm bảo kết quả hợp lệ
```

❌ **Sử dụng API thủ công (Không khuyến khích):**

```javascript
// Phải tự tính setNumber và validate
POST /api/match-sets
{
  "matchId": 1,
  "setNumber": 1, // Phải tự tính
  "entryAScore": 11,
  "entryBScore": 5
}
// ❌ Không có validation tự động
// ❌ Có thể nhập sai setNumber
```

### **2. Workflow Hoàn Chỉnh với Match**

```javascript
// 1. Start match
POST /api/matches/1/start

// 2. Nhập điểm từng set
POST /api/match-sets/score
{
  "matchId": 1,
  "entryAScore": 11,
  "entryBScore": 5
}

POST /api/match-sets/score
{
  "matchId": 1,
  "entryAScore": 11,
  "entryBScore": 9
}

// 3. Finalize match (auto tính winner)
POST /api/matches/1/finalize
```

### **3. Lưu ý quan trọng**

❌ **KHÔNG** update điểm real-time từng ball (1-0, 2-0, 2-1...)

✅ **CHỈ** update điểm TỔNG KẾT khi set kết thúc

### **4. Tính Winner từ Match Sets (Nếu dùng API thủ công)**

```javascript
const calculateMatchWinner = (matchSets, match) => {
  let entryAWins = 0;
  let entryBWins = 0;

  matchSets.forEach((set) => {
    if (set.entryAScore > set.entryBScore) {
      entryAWins++;
    } else if (set.entryBScore > set.entryAScore) {
      entryBWins++;
    }
  });

  // Best of 3: first to 2 wins
  // Best of 5: first to 3 wins
  if (entryAWins > entryBWins) {
    return match.entryAId;
  } else if (entryBWins > entryAWins) {
    return match.entryBId;
  }

  return null; // Draw (không nên xảy ra)
};
```

### **3. Validation Rules**

- `setNumber` phải là số nguyên dương (1, 2, 3...)
- `setNumber` không được trùng trong cùng một match
- Điểm phải >= 0
- Điểm thường >= 11 trong table tennis (trừ deuce)
- Chênh lệch điểm thắng thường >= 2

### **4. Best Practices**

✅ **Nên:**

- Tạo match set sau khi set kết thúc
- Validate điểm hợp lệ (>= 11, chênh lệch >= 2)
- Sắp xếp sets theo `setNumber` khi hiển thị
- Cache match sets để tính winner nhanh

❌ **Không nên:**

- Update điểm real-time từng ball
- Tạo match set khi set chưa kết thúc
- Skip việc validate điểm

### **5. Score Display Format**

```javascript
// Hiển thị điểm đẹp
const formatSetScore = (set) => {
  return `${set.entryAScore}-${set.entryBScore}`;
};

// Example: "11-5", "11-9", "12-10"

// Hiển thị tổng kết trận
const formatMatchScore = (matchSets, match) => {
  const setScores = matchSets.map((s) => formatSetScore(s));

  let entryAWins = 0;
  let entryBWins = 0;
  matchSets.forEach((s) => {
    if (s.entryAScore > s.entryBScore) entryAWins++;
    else if (s.entryBScore > s.entryAScore) entryBWins++;
  });

  return {
    setsWon: `${entryAWins}-${entryBWins}`,
    setScores: setScores,
    winner: entryAWins > entryBWins ? match.entryAId : match.entryBId,
  };
};

// Example output:
// {
//   setsWon: "2-1",
//   setScores: ["11-5", "11-9", "9-11"],
//   winner: 5
// }
```

---

## **TypeScript Interfaces**

```typescript
// Match Set Model
interface MatchSet {
  id: number;
  matchId: number;
  setNumber: number;
  entryAScore: number;
  entryBScore: number;
  createdAt: string;
  updatedAt: string;
}

// Create Match Set Request
interface CreateMatchSetRequest {
  matchId: number;
  setNumber: number;
  entryAScore: number;
  entryBScore: number;
}

// Update Match Set Request
interface UpdateMatchSetRequest {
  entryAScore?: number;
  entryBScore?: number;
}

// Match Score Summary
interface MatchScoreSummary {
  matchId: number;
  sets: MatchSet[];
  entryASetsWon: number;
  entryBSetsWon: number;
  isCompleted: boolean;
  winnerId?: number;
}
```

---

## **Common Use Cases**

### **Use Case 1: Tạo set sau khi kết thúc**

```javascript
const recordSetScore = async (matchId, setNumber, entryAScore, entryBScore) => {
  const response = await fetch("/api/match-sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matchId,
      setNumber,
      entryAScore,
      entryBScore,
    }),
  });

  return await response.json();
};

// Usage
await recordSetScore(1, 1, 11, 5); // Set 1: 11-5
await recordSetScore(1, 2, 11, 9); // Set 2: 11-9
await recordSetScore(1, 3, 9, 11); // Set 3: 9-11
```

### **Use Case 2: Lấy và hiển thị score board**

```javascript
const getMatchScoreBoard = async (matchId) => {
  const match = await fetch(`/api/matches/${matchId}`).then((r) => r.json());
  const sets = await fetch(`/api/match-sets/match/${matchId}`).then((r) =>
    r.json(),
  );

  return {
    match,
    sets,
    score: formatMatchScore(sets, match),
  };
};

// Usage
const scoreBoard = await getMatchScoreBoard(1);
console.log(scoreBoard.score);
// {
//   setsWon: "2-1",
//   setScores: ["11-5", "11-9", "9-11"],
//   winner: 5
// }
```

### **Use Case 3: Tự động update winner khi đủ sets**

```javascript
const completeMatchIfNeeded = async (matchId, maxSets) => {
  const match = await fetch(`/api/matches/${matchId}`).then((r) => r.json());
  const sets = await fetch(`/api/match-sets/match/${matchId}`).then((r) =>
    r.json(),
  );

  // Best of 3: first to 2
  // Best of 5: first to 3
  const setsToWin = Math.ceil(maxSets / 2);

  let entryAWins = 0;
  let entryBWins = 0;

  sets.forEach((set) => {
    if (set.entryAScore > set.entryBScore) entryAWins++;
    else if (set.entryBScore > set.entryAScore) entryBWins++;
  });

  // Check if match is completed
  if (entryAWins >= setsToWin || entryBWins >= setsToWin) {
    const winnerId = entryAWins > entryBWins ? match.entryAId : match.entryBId;

    // Update match
    await fetch(`/api/matches/${matchId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: "completed",
        winnerEntryId: winnerId,
      }),
    });

    return { completed: true, winnerId };
  }

  return { completed: false };
};

// Usage
await completeMatchIfNeeded(1, 3); // Best of 3
```

### **Use Case 4: Sửa lỗi điểm đã nhập**

```javascript
const correctSetScore = async (setId, entryAScore, entryBScore) => {
  const response = await fetch(`/api/match-sets/${setId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ entryAScore, entryBScore }),
  });

  return await response.json();
};

// Usage: Sửa điểm set 1 từ 11-5 thành 11-8
await correctSetScore(1, 11, 8);
```

### **Use Case 5: Validate điểm hợp lệ**

```javascript
const validateSetScore = (entryAScore, entryBScore) => {
  // Basic validation
  if (entryAScore < 0 || entryBScore < 0) {
    return { valid: false, error: "Điểm không được âm" };
  }

  // At least one player must reach 11
  if (entryAScore < 11 && entryBScore < 11) {
    return { valid: false, error: "Ít nhất một bên phải đạt 11 điểm" };
  }

  // Winner must have at least 2 points difference (except deuce)
  const diff = Math.abs(entryAScore - entryBScore);

  if (entryAScore >= 11 || entryBScore >= 11) {
    if (diff < 2) {
      return { valid: false, error: "Chênh lệch điểm phải >= 2" };
    }
  }

  // Deuce: both >= 10, diff must be 2
  if (entryAScore >= 10 && entryBScore >= 10) {
    if (diff !== 2) {
      return {
        valid: false,
        error: "Trong deuce, chênh lệch phải đúng 2 điểm",
      };
    }
  }

  return { valid: true };
};

// Usage
const validation = validateSetScore(11, 5);
if (!validation.valid) {
  alert(validation.error);
}
```
