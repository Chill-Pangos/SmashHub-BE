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
6. [Start Match](#6-start-match)
7. [Finalize Match](#7-finalize-match)
8. [Update Match](#8-update-match)
9. [Delete Match](#9-delete-match)

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

## **6. Start Match**

### **Endpoint**

```
POST /api/matches/{id}/start
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Bắt đầu một trận đấu:
- Tự động tìm và assign **2 trọng tài** (umpire + assistant umpire) còn trống
- Thay đổi status từ `scheduled` → `in_progress`
- Chỉ start được khi match đang ở trạng thái `scheduled`

**Use case:**
- Khi trận đấu sắp bắt đầu, gọi API này để chuẩn bị
- Hệ thống tự động phân công trọng tài không bị trùng lịch
- Frontend có thể hiển thị thông tin trọng tài được assign

### **Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Match ID    |

### **Request Example**

```http
POST /api/matches/1/start
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "scheduleId": 5,
  "entryAId": 10,
  "entryBId": 15,
  "status": "in_progress",
  "umpire": 45,
  "assistantUmpire": 48,
  "winnerEntryId": null,
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T14:30:00.000Z"
}
```

### **Error Responses**

**400 Bad Request - Match không ở trạng thái scheduled**

```json
{
  "message": "Cannot start match. Current status is in_progress, but it must be scheduled"
}
```

**400 Bad Request - Không đủ trọng tài**

```json
{
  "message": "Not enough available referees. Found 1, need 2"
}
```

**404 Not Found**

```json
{
  "message": "Match not found"
}
```

---

## **7. Finalize Match**

### **Endpoint**

```
POST /api/matches/{id}/finalize
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Tổng kết và kết thúc trận đấu:

1. **Kiểm tra tỉ số sets** để xác định người thắng
   - Best of 3: cần thắng 2 sets
   - Best of 5: cần thắng 3 sets
2. **Update status** từ `in_progress` → `completed`
3. **Set winnerEntryId** dựa trên kết quả
4. **Update vòng bảng** (Group Stage):
   - Cập nhật `matchesPlayed`, `matchesWon`, `matchesLost`
   - Cập nhật `setsWon`, `setsLost`, `setsDiff`
   - Tính lại `position` trong bảng
5. **Update vòng knockout** (Knockout Stage):
   - Ghi nhận `winnerEntryId` vào bracket
   - **Tự động tạo match vòng tiếp theo** nếu đủ 2 entries
   - Liên kết winner vào `nextBracketId`

**⚠️ Điều kiện:**
- Match phải đang ở trạng thái `in_progress`
- Phải có đủ sets đã hoàn thành
- Phải có người thắng rõ ràng (không hòa)

### **Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Match ID    |

### **Request Example**

```http
POST /api/matches/1/finalize
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Response - 200 OK**

**Scenario: Group Stage Match**

```json
{
  "id": 1,
  "scheduleId": 5,
  "entryAId": 10,
  "entryBId": 15,
  "status": "completed",
  "winnerEntryId": 10,
  "umpire": 45,
  "assistantUmpire": 48,
  "isConfirmedByWinner": false,
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T15:45:00.000Z"
}
```

**Kết quả:**
- ✅ Entry A (ID: 10) thắng 2-0
- ✅ Group standings đã được update
- ✅ Match status = completed

**Scenario: Knockout Stage Match**

```json
{
  "id": 15,
  "scheduleId": 22,
  "entryAId": 3,
  "entryBId": 7,
  "status": "completed",
  "winnerEntryId": 7,
  "umpire": 45,
  "assistantUmpire": 48,
  "createdAt": "2026-01-22T10:00:00.000Z",
  "updatedAt": "2026-01-22T16:30:00.000Z"
}
```

**Kết quả:**
- ✅ Entry B (ID: 7) thắng 2-1
- ✅ Knockout bracket đã được update với winner
- ✅ Nếu đối thủ vòng sau đã có, match tiếp theo sẽ được tạo tự động

### **Error Responses**

**400 Bad Request - Match không in_progress**

```json
{
  "message": "Cannot finalize match. Match status must be in_progress"
}
```

**400 Bad Request - Chưa đủ sets**

```json
{
  "message": "Cannot finalize match. Not enough sets completed. Entry A: 1 sets, Entry B: 0 sets"
}
```

**400 Bad Request - Không có winner**

```json
{
  "message": "Cannot finalize match. No clear winner determined"
}
```

**404 Not Found**

```json
{
  "message": "Match not found"
}
```

---

## **8. Update Match**

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

## **9. Delete Match**

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

### **2. Workflow Thi Đấu (Recommended)**

✅ **Workflow tự động với Start & Finalize APIs:**

```javascript
// 1. Bắt đầu trận đấu (auto assign trọng tài)
POST /api/matches/1/start
// → Status: scheduled → in_progress
// → Umpires assigned automatically

// 2. Sau mỗi set kết thúc, nhập điểm set
POST /api/match-sets/score
{
  "matchId": 1,
  "entryAScore": 11,
  "entryBScore": 5
}

// 3. Kết thúc trận đấu (auto tính winner và update standings/brackets)
POST /api/matches/1/finalize
// → Status: in_progress → completed
// → Winner determined automatically
// → Group standings or knockout brackets updated
// → Next match created (if knockout stage)
```

❌ **Workflow thủ công (không khuyến khích):**

```javascript
// 1. Update status = in_progress thủ công
PUT /api/matches/1
{ "status": "in_progress", "umpire": 45, "assistantUmpire": 48 }

// 2. Sau mỗi set kết thúc, update điểm set
POST /api/match-sets
{
  "matchId": 1,
  "setNumber": 1,
  "entryAScore": 11,
  "entryBScore": 5
}

// 3. Update match với winner và status thủ công
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
