# 📘 API Documentation - Match Operations

Tài liệu này mô tả các API để **quản lý matches (trận đấu)** trong tournaments.

> 📝 **Lưu ý quan trọng:**
>
> - Match được tạo tự động khi generate schedule
> - Cập nhật **điểm tổng kết từng set**, không real-time
> - Cập nhật **người thắng** sau khi hoàn tất trận đấu
> - Status transitions: `scheduled` → `in_progress` → `completed`

---

## **Table of Contents**

1. [Create Match](#1-create-match)
2. [Get All Matches](#2-get-all-matches)
3. [Get Match by ID](#3-get-match-by-id)
4. [Get Matches by Schedule ID](#4-get-matches-by-schedule-id)
5. [Get Matches by Status](#5-get-matches-by-status)
6. [Update Match](#6-update-match)
7. [Delete Match](#7-delete-match)

---

## **1. Create Match**

### **Endpoint**

```
POST /api/matches
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication trong production)

### **Description**

Tạo một match mới.

> ⚠️ **Lưu ý:** Thông thường match được tạo tự động khi generate schedule. API này dùng để tạo manual trong trường hợp đặc biệt.

### **Request Body**

#### **Required Fields:**

| Field        | Type    | Description                    | Example       |
| ------------ | ------- | ------------------------------ | ------------- |
| `scheduleId` | integer | ID của schedule chứa match này | `1`           |
| `entryAId`   | integer | ID của entry/đội A             | `5`           |
| `entryBId`   | integer | ID của entry/đội B             | `8`           |
| `status`     | enum    | Trạng thái trận đấu            | `"scheduled"` |

#### **Optional Fields:**

| Field             | Type    | Description                  | Example |
| ----------------- | ------- | ---------------------------- | ------- |
| `winnerEntryId`   | integer | ID của entry thắng           | `5`     |
| `umpire`          | integer | ID của trọng tài chính       | `10`    |
| `assistantUmpire` | integer | ID của trọng tài phụ         | `11`    |
| `coachAId`        | integer | ID của huấn luyện viên đội A | `20`    |
| `coachBId`        | integer | ID của huấn luyện viên đội B | `21`    |

**Status enum:** `scheduled`, `in_progress`, `completed`, `cancelled`

### **Request Example**

```json
{
  "scheduleId": 1,
  "entryAId": 5,
  "entryBId": 8,
  "status": "scheduled",
  "umpire": 10
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "scheduleId": 1,
  "entryAId": 5,
  "entryBId": 8,
  "status": "scheduled",
  "winnerEntryId": null,
  "umpire": 10,
  "assistantUmpire": null,
  "coachAId": null,
  "coachBId": null,
  "isConfirmedByWinner": false,
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T10:00:00.000Z"
}
```

### **Error Responses**

```json
{
  "message": "Error creating match",
  "error": {}
}
```

---

## **2. Get All Matches**

### **Endpoint**

```
GET /api/matches
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tất cả matches.

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/matches?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "scheduleId": 1,
    "entryAId": 5,
    "entryBId": 8,
    "status": "completed",
    "winnerEntryId": 5,
    "umpire": 10,
    "assistantUmpire": null,
    "coachAId": 20,
    "coachBId": 21,
    "isConfirmedByWinner": true,
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T12:30:00.000Z"
  },
  {
    "id": 2,
    "scheduleId": 2,
    "entryAId": 6,
    "entryBId": 9,
    "status": "in_progress",
    "winnerEntryId": null,
    "umpire": 11,
    "assistantUmpire": 12,
    "coachAId": null,
    "coachBId": null,
    "isConfirmedByWinner": false,
    "createdAt": "2026-01-20T11:00:00.000Z",
    "updatedAt": "2026-01-20T11:30:00.000Z"
  }
]
```

### **Error Responses**

```json
{
  "message": "Error fetching matches",
  "error": {}
}
```

---

## **3. Get Match by ID**

### **Endpoint**

```
GET /api/matches/{id}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin chi tiết của một match theo ID.

### **Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Match ID    |

### **Request Example**

```http
GET /api/matches/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "scheduleId": 1,
  "entryAId": 5,
  "entryBId": 8,
  "status": "completed",
  "winnerEntryId": 5,
  "umpire": 10,
  "assistantUmpire": null,
  "coachAId": 20,
  "coachBId": 21,
  "isConfirmedByWinner": true,
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T12:30:00.000Z"
}
```

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Match not found"
}
```

---

## **4. Get Matches by Schedule ID**

### **Endpoint**

```
GET /api/matches/schedule/{scheduleId}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy tất cả matches thuộc một schedule cụ thể.

### **Path Parameters**

| Parameter    | Type    | Required | Description |
| ------------ | ------- | -------- | ----------- |
| `scheduleId` | integer | Yes      | Schedule ID |

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/matches/schedule/1?skip=0&limit=10
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "scheduleId": 1,
    "entryAId": 5,
    "entryBId": 8,
    "status": "completed",
    "winnerEntryId": 5,
    "umpire": 10,
    "isConfirmedByWinner": true,
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T12:30:00.000Z"
  }
]
```

---

## **5. Get Matches by Status**

### **Endpoint**

```
GET /api/matches/status/{status}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách matches theo trạng thái (scheduled, in_progress, completed, cancelled).

### **Path Parameters**

| Parameter | Type   | Required | Description                 | Enum Values                                          |
| --------- | ------ | -------- | --------------------------- | ---------------------------------------------------- |
| `status`  | string | Yes      | Trạng thái match cần filter | `scheduled`, `in_progress`, `completed`, `cancelled` |

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Examples**

```http
GET /api/matches/status/in_progress

GET /api/matches/status/completed?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 2,
    "scheduleId": 2,
    "entryAId": 6,
    "entryBId": 9,
    "status": "in_progress",
    "winnerEntryId": null,
    "umpire": 11,
    "assistantUmpire": 12,
    "isConfirmedByWinner": false,
    "createdAt": "2026-01-20T11:00:00.000Z",
    "updatedAt": "2026-01-20T11:30:00.000Z"
  }
]
```

### **Error Responses**

**400 Bad Request** - Status không hợp lệ

```json
{
  "message": "Invalid status value. Must be one of: scheduled, in_progress, completed, cancelled"
}
```

---

## **6. Update Match**

### **Endpoint**

```
PUT /api/matches/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Cập nhật thông tin match, bao gồm:

- **Cập nhật status** khi bắt đầu/kết thúc trận
- **Cập nhật winner** sau khi tính tổng điểm các sets
- **Cập nhật trọng tài và huấn luyện viên**
- **Xác nhận kết quả** từ phía người thắng

### **⚠️ Workflow chuẩn:**

1. Trận đấu bắt đầu: `status = "in_progress"`
2. Cập nhật điểm từng set qua [Match Sets API](#match-sets)
3. Tính người thắng dựa trên số sets thắng
4. Update match: `status = "completed"` + `winnerEntryId`
5. Người thắng xác nhận: `isConfirmedByWinner = true`

### **Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Match ID    |

### **Request Body**

Tất cả fields đều **optional** - chỉ gửi những gì cần update.

| Field                 | Type    | Description                  | Example       |
| --------------------- | ------- | ---------------------------- | ------------- |
| `status`              | enum    | Trạng thái trận đấu          | `"completed"` |
| `winnerEntryId`       | integer | ID của entry thắng           | `5`           |
| `umpire`              | integer | ID của trọng tài chính       | `10`          |
| `assistantUmpire`     | integer | ID của trọng tài phụ         | `11`          |
| `coachAId`            | integer | ID của huấn luyện viên đội A | `20`          |
| `coachBId`            | integer | ID của huấn luyện viên đội B | `21`          |
| `isConfirmedByWinner` | boolean | Đã được người thắng xác nhận | `true`        |

**Status enum:** `scheduled`, `in_progress`, `completed`, `cancelled`

### **Request Examples**

#### **Example 1: Bắt đầu trận đấu**

```json
{
  "status": "in_progress"
}
```

#### **Example 2: Kết thúc trận và cập nhật winner**

```json
{
  "status": "completed",
  "winnerEntryId": 5
}
```

#### **Example 3: Người thắng xác nhận kết quả**

```json
{
  "isConfirmedByWinner": true
}
```

#### **Example 4: Hủy trận đấu**

```json
{
  "status": "cancelled"
}
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "scheduleId": 1,
  "entryAId": 5,
  "entryBId": 8,
  "status": "completed",
  "winnerEntryId": 5,
  "umpire": 10,
  "assistantUmpire": null,
  "coachAId": 20,
  "coachBId": 21,
  "isConfirmedByWinner": true,
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T12:30:00.000Z"
}
```

### **Error Responses**

**400 Bad Request**

```json
{
  "message": "Error updating match",
  "error": {}
}
```

**404 Not Found**

```json
{
  "message": "Match not found"
}
```

---

## **7. Delete Match**

### **Endpoint**

```
DELETE /api/matches/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Xóa một match. ⚠️ **Cảnh báo:** Xóa match sẽ xóa luôn các match sets liên quan (cascade delete).

### **Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Match ID    |

### **Request Example**

```http
DELETE /api/matches/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Response - 204 No Content**

Không có response body. Status code 204 nghĩa là xóa thành công.

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Match not found"
}
```

---

## **Important Notes cho Frontend**

### **1. Match Status Workflow**

```
scheduled → in_progress → completed
              ↓
          cancelled
```

- **scheduled:** Match đã được tạo, chưa bắt đầu
- **in_progress:** Đang thi đấu
- **completed:** Đã hoàn tất, có winner
- **cancelled:** Bị hủy

### **2. Cập nhật điểm và winner**

❌ **KHÔNG** cập nhật điểm real-time từng ball

✅ **CÓ** cập nhật điểm tổng kết mỗi set

```javascript
// Workflow đúng:
// 1. Update status = in_progress
PUT /api/matches/1
{ "status": "in_progress" }

// 2. Sau mỗi set kết thúc, update điểm set
POST /api/match-sets
{
  "matchId": 1,
  "setNumber": 1,
  "entryAScore": 11,
  "entryBScore": 5
}

// 3. Sau khi tất cả sets kết thúc, tính winner
// Ví dụ: Best of 3, Entry A thắng 2-0
// → winnerEntryId = entryAId

// 4. Update match với winner và status
PUT /api/matches/1
{
  "status": "completed",
  "winnerEntryId": 5
}
```

### **3. Validation Rules**

- `winnerEntryId` phải là `entryAId` hoặc `entryBId`
- Không thể set `winnerEntryId` nếu `status` != `"completed"`
- `isConfirmedByWinner` chỉ có ý nghĩa khi `status = "completed"`

### **4. Best Practices**

✅ **Nên:**

- Update status theo workflow đúng
- Cập nhật winner sau khi tính tổng điểm các sets
- Validate winner phải là một trong hai entries
- Cho phép winner xác nhận kết quả

❌ **Không nên:**

- Cập nhật điểm real-time từng ball
- Update winner khi match chưa completed
- Skip việc update status = in_progress

---

## **TypeScript Interfaces**

```typescript
// Match Model
interface Match {
  id: number;
  scheduleId: number;
  entryAId: number;
  entryBId: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
  coachAId?: number;
  coachBId?: number;
  isConfirmedByWinner?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create Match Request
interface CreateMatchRequest {
  scheduleId: number;
  entryAId: number;
  entryBId: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
  coachAId?: number;
  coachBId?: number;
}

// Update Match Request
interface UpdateMatchRequest {
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  winnerEntryId?: number;
  umpire?: number;
  assistantUmpire?: number;
  coachAId?: number;
  coachBId?: number;
  isConfirmedByWinner?: boolean;
}
```

---

## **Common Use Cases**

### **Use Case 1: Bắt đầu trận đấu**

```javascript
const startMatch = async (matchId) => {
  const response = await fetch(`/api/matches/${matchId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: "in_progress" }),
  });

  return await response.json();
};
```

### **Use Case 2: Kết thúc trận và cập nhật winner**

```javascript
const completeMatch = async (matchId, winnerEntryId) => {
  // Ensure winner is calculated from match sets
  const matchSets = await fetch(`/api/match-sets/match/${matchId}`).then((r) =>
    r.json(),
  );

  // Calculate winner based on sets won
  let entryAWins = 0;
  let entryBWins = 0;

  matchSets.forEach((set) => {
    if (set.entryAScore > set.entryBScore) entryAWins++;
    else if (set.entryBScore > set.entryAScore) entryBWins++;
  });

  // Update match
  const response = await fetch(`/api/matches/${matchId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status: "completed",
      winnerEntryId: entryAWins > entryBWins ? match.entryAId : match.entryBId,
    }),
  });

  return await response.json();
};
```

### **Use Case 3: Lấy matches đang diễn ra**

```javascript
const getLiveMatches = async () => {
  const response = await fetch("/api/matches/status/in_progress?limit=100");
  return await response.json();
};
```

### **Use Case 4: Lấy lịch sử trận đấu của một entry**

```javascript
const getEntryMatches = async (entryId) => {
  const allMatches = await fetch("/api/matches?limit=1000").then((r) =>
    r.json(),
  );

  return allMatches.filter(
    (match) => match.entryAId === entryId || match.entryBId === entryId,
  );
};
```

### **Use Case 5: Xác nhận kết quả trận đấu**

```javascript
const confirmMatchResult = async (matchId) => {
  const response = await fetch(`/api/matches/${matchId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isConfirmedByWinner: true }),
  });

  return await response.json();
};
```
