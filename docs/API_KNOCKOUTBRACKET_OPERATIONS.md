# 📘 API Documentation - Knockout Bracket Operations

Tài liệu này mô tả các API để **quản lý knockout brackets (nhánh đấu loại trực tiếp)** trong tournaments.

> 📝 **Lưu ý quan trọng:**
>
> - Knockout Bracket dùng cho **vòng đấu loại trực tiếp** (single elimination)
> - Hỗ trợ **tự động generate bracket structure** dựa trên số lượng entries
> - **Advance winner** tự động sang vòng tiếp theo
> - Xử lý **bye matches** khi số entries không phải lũy thừa của 2

---

## **Table of Contents**

1. [Create Knockout Bracket](#1-create-knockout-bracket)
2. [Get All Knockout Brackets](#2-get-all-knockout-brackets)
3. [Get Knockout Bracket by ID](#3-get-knockout-bracket-by-id)
4. [Get Knockout Brackets by Content ID](#4-get-knockout-brackets-by-content-id)
5. [Update Knockout Bracket](#5-update-knockout-bracket)
6. [Delete Knockout Bracket](#6-delete-knockout-bracket)
7. [Generate Knockout Bracket](#7-generate-knockout-bracket)
8. [Generate Bracket from Groups](#8-generate-bracket-from-groups)
9. [Advance Winner](#9-advance-winner)

---

## **1. Create Knockout Bracket**

### **Endpoint**

```
POST /api/knockout-brackets
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Tạo một knockout bracket entry mới (thường dùng khi manual setup).

> ⚠️ **Khuyến nghị:** Sử dụng API [Generate Knockout Bracket](#7-generate-knockout-bracket) thay vì tạo thủ công.

### **Request Body**

#### **Required Fields:**

| Field             | Type    | Description                        | Example |
| ----------------- | ------- | ---------------------------------- | ------- |
| `contentId`       | integer | ID của tournament content          | `1`     |
| `roundNumber`     | integer | Số vòng (1=Final, 2=Semi, 3=QF...) | `2`     |
| `bracketPosition` | integer | Vị trí trong vòng (0, 1, 2...)     | `0`     |

#### **Optional Fields:**

| Field                | Type    | Description                               | Example          |
| -------------------- | ------- | ----------------------------------------- | ---------------- |
| `entryAId`           | integer | ID của entry A                            | `5`              |
| `entryBId`           | integer | ID của entry B                            | `8`              |
| `seedA`              | integer | Seed của entry A                          | `1`              |
| `seedB`              | integer | Seed của entry B                          | `8`              |
| `nextBracketId`      | integer | ID của bracket vòng sau                   | `10`             |
| `previousBracketAId` | integer | ID của bracket trước (entry A)            | `5`              |
| `previousBracketBId` | integer | ID của bracket trước (entry B)            | `6`              |
| `roundName`          | string  | Tên vòng đấu                              | `"Semi-Final 1"` |
| `isByeMatch`         | boolean | Trận đấu bye (một entry tự động đi tiếp) | `false`          |

> 📝 **Về isByeMatch:** Khi `isByeMatch = true`, nghĩa là trận đấu này không diễn ra thực tế. Entry trong trận bye sẽ tự động advance sang vòng tiếp theo mà không cần thi đấu. Thường dùng khi số lượng entries không phải là lũy thừa của 2 (ví dụ: 12 đội thì cần 4 bye matches để tạo thành bracket 16).

### **Request Example**

```json
{
  "contentId": 1,
  "roundNumber": 2,
  "bracketPosition": 0,
  "entryAId": 5,
  "entryBId": 8,
  "seedA": 1,
  "seedB": 8,
  "roundName": "Semi-Final 1",
  "isByeMatch": false
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "contentId": 1,
    "roundNumber": 2,
    "bracketPosition": 0,
    "scheduleId": null,
    "matchId": null,
    "entryAId": 5,
    "entryBId": 8,
    "winnerEntryId": null,
    "seedA": 1,
    "seedB": 8,
    "nextBracketId": null,
    "previousBracketAId": null,
    "previousBracketBId": null,
    "status": "pending",
    "roundName": "Semi-Final 1",
    "isByeMatch": false,
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T10:00:00.000Z"
  }
}
```

### **Error Responses**

```json
{
  "success": false,
  "message": "Error creating knockout bracket"
}
```

---

## **2. Get All Knockout Brackets**

### **Endpoint**

```
GET /api/knockout-brackets
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tất cả knockout brackets.

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/knockout-brackets?skip=0&limit=20
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contentId": 1,
      "roundNumber": 1,
      "bracketPosition": 0,
      "scheduleId": 25,
      "matchId": 30,
      "entryAId": 5,
      "entryBId": 8,
      "winnerEntryId": 5,
      "seedA": 1,
      "seedB": 4,
      "nextBracketId": null,
      "previousBracketAId": 3,
      "previousBracketBId": 4,
      "status": "completed",
      "roundName": "Final",
      "isByeMatch": false,
      "createdAt": "2026-01-20T10:00:00.000Z",
      "updatedAt": "2026-01-20T15:30:00.000Z"
    }
  ]
}
```

---

## **3. Get Knockout Bracket by ID**

### **Endpoint**

```
GET /api/knockout-brackets/{id}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin chi tiết của một knockout bracket theo ID.

### **Path Parameters**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `id`      | integer | Yes      | Knockout Bracket ID |

### **Request Example**

```http
GET /api/knockout-brackets/1
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "contentId": 1,
    "roundNumber": 1,
    "bracketPosition": 0,
    "scheduleId": 25,
    "matchId": 30,
    "entryAId": 5,
    "entryBId": 8,
    "winnerEntryId": 5,
    "seedA": 1,
    "seedB": 4,
    "nextBracketId": null,
    "previousBracketAId": 3,
    "previousBracketBId": 4,
    "status": "completed",
    "roundName": "Final",
    "isByeMatch": false,
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T15:30:00.000Z"
  }
}
```

### **Error Responses**

**404 Not Found**

```json
{
  "success": false,
  "message": "Knockout bracket not found"
}
```

---

## **4. Get Knockout Brackets by Content ID**

### **Endpoint**

```
GET /api/knockout-brackets/content/{contentId}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy tất cả knockout brackets của một tournament content, **được sắp xếp theo roundNumber và bracketPosition**.

**Use case chính:**

- Hiển thị toàn bộ cấu trúc bracket tree
- Xem tất cả vòng đấu knockout
- Theo dõi tiến trình tournament

### **Path Parameters**

| Parameter   | Type    | Required | Description           |
| ----------- | ------- | -------- | --------------------- |
| `contentId` | integer | Yes      | Tournament Content ID |

### **Request Example**

```http
GET /api/knockout-brackets/content/1
```

### **Response - 200 OK**

**Example: 8 teams, 3 rounds (Quarter-Finals → Semi-Finals → Final)**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contentId": 1,
      "roundNumber": 3,
      "bracketPosition": 0,
      "scheduleId": 10,
      "matchId": 15,
      "entryAId": 5,
      "entryBId": 12,
      "winnerEntryId": 5,
      "seedA": 1,
      "seedB": 8,
      "nextBracketId": 9,
      "status": "completed",
      "roundName": "Quarter-Final 1",
      "isByeMatch": false,
      "entry_a": {
        "id": 5,
        "team": { "name": "Team Alpha" }
      },
      "entry_b": {
        "id": 12,
        "team": { "name": "Team Omega" }
      }
    },
    {
      "id": 2,
      "contentId": 1,
      "roundNumber": 3,
      "bracketPosition": 1,
      "scheduleId": 11,
      "matchId": 16,
      "entryAId": 3,
      "entryBId": 9,
      "winnerEntryId": 9,
      "seedA": 4,
      "seedB": 5,
      "nextBracketId": 9,
      "status": "completed",
      "roundName": "Quarter-Final 2",
      "isByeMatch": false
    },
    {
      "id": 9,
      "contentId": 1,
      "roundNumber": 2,
      "bracketPosition": 0,
      "scheduleId": 20,
      "matchId": null,
      "entryAId": 5,
      "entryBId": 9,
      "winnerEntryId": null,
      "seedA": 1,
      "seedB": 5,
      "nextBracketId": 15,
      "previousBracketAId": 1,
      "previousBracketBId": 2,
      "status": "ready",
      "roundName": "Semi-Final 1",
      "isByeMatch": false
    },
    {
      "id": 15,
      "contentId": 1,
      "roundNumber": 1,
      "bracketPosition": 0,
      "scheduleId": null,
      "matchId": null,
      "entryAId": null,
      "entryBId": null,
      "winnerEntryId": null,
      "nextBracketId": null,
      "previousBracketAId": 9,
      "previousBracketBId": 10,
      "status": "pending",
      "roundName": "Final",
      "isByeMatch": false
    }
  ]
}
```

**Giải thích cấu trúc:**

- Round 3 (QF): 4 brackets
- Round 2 (SF): 2 brackets
- Round 1 (Final): 1 bracket
- Status flow: `pending` → `ready` (có đủ entries) → `in_progress` → `completed`

---

## **5. Update Knockout Bracket**

### **Endpoint**

```
PUT /api/knockout-brackets/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Cập nhật knockout bracket (thường dùng để update scheduleId, matchId, status).

### **Path Parameters**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `id`      | integer | Yes      | Knockout Bracket ID |

### **Request Body**

Tất cả fields đều **optional** - chỉ gửi những gì cần update.

| Field           | Type    | Description                                  | Example       |
| --------------- | ------- | -------------------------------------------- | ------------- |
| `scheduleId`    | integer | ID của schedule                              | `25`          |
| `matchId`       | integer | ID của match                                 | `30`          |
| `entryAId`      | integer | ID của entry A                               | `5`           |
| `entryBId`      | integer | ID của entry B                               | `8`           |
| `winnerEntryId` | integer | ID của entry thắng                           | `5`           |
| `status`        | string  | Status (pending/ready/in_progress/completed) | `"completed"` |

### **Request Example**

```json
{
  "matchId": 30,
  "winnerEntryId": 5,
  "status": "completed"
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Knockout bracket updated successfully"
}
```

### **Error Responses**

**404 Not Found**

```json
{
  "success": false,
  "message": "Knockout bracket not found"
}
```

---

## **6. Delete Knockout Bracket**

### **Endpoint**

```
DELETE /api/knockout-brackets/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Xóa một knockout bracket entry.

### **Path Parameters**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `id`      | integer | Yes      | Knockout Bracket ID |

### **Request Example**

```http
DELETE /api/knockout-brackets/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Knockout bracket deleted successfully"
}
```

### **Error Responses**

**404 Not Found**

```json
{
  "success": false,
  "message": "Knockout bracket not found"
}
```

---

## **7. Generate Knockout Bracket**

### **Endpoint**

```
POST /api/knockout-brackets/generate
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Tự động tạo cấu trúc nhánh đấu vòng loại trực tiếp (single elimination bracket).

**Điều kiện:**
1. Số nhánh phải là lũy thừa của 2 (16, 32, 64...)
2. Entries cùng team không gặp nhau ở vòng đầu (nếu có thông tin team)
3. **Bye matches được phân bổ ngẫu nhiên** vào các vị trí trong bracket
4. Cân bằng 2 nhánh đấu (top half và bottom half)
5. Tối thiểu 12 đội

**Xử lý Bye Matches:**
- Khi số entries không phải lũy thừa của 2, hệ thống tự động tính toán số bye matches cần thiết
- Ví dụ: 12 entries → bracket size 16 → cần 4 bye matches
- Bye matches (`isByeMatch = true`) được đặt ngẫu nhiên vào các vị trí vòng 1
- Entry trong bye match tự động advance sang vòng tiếp theo
- Các bye matches được phân bổ đều vào cả 2 nhánh (top half và bottom half)

### **Request Body**

| Field       | Type    | Required | Description                               |
| ----------- | ------- | -------- | ----------------------------------------- |
| `contentId` | integer | Yes      | Tournament content ID (tự động lấy entries từ database) |

### **Request Example**

```json
{
  "contentId": 1
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Knockout bracket generated successfully",
  "data": {
    "contentId": 1,
    "totalRounds": 4,
    "totalBrackets": 15,
    "bracketSize": 16,
    "numEntries": 12,
    "numByes": 4,
    "rounds": [
      {
        "roundNumber": 4,
        "roundName": "Round of 16",
        "brackets": [
          {
            "id": 1,
            "contentId": 1,
            "roundNumber": 4,
            "bracketPosition": 0,
            "entryAId": 5,
            "entryBId": null,
            "isByeMatch": true,
            "status": "ready",
            "roundName": "Round of 16",
            "nextBracketId": 9
          },
          {
            "id": 2,
            "contentId": 1,
            "roundNumber": 4,
            "bracketPosition": 1,
            "entryAId": 8,
            "entryBId": 12,
            "isByeMatch": false,
            "status": "ready",
            "roundName": "Round of 16",
            "nextBracketId": 9
          }
        ]
      },
      {
        "roundNumber": 3,
        "roundName": "Quarter-final",
        "brackets": [
          {
            "id": 9,
            "contentId": 1,
            "roundNumber": 3,
            "bracketPosition": 0,
            "entryAId": null,
            "entryBId": null,
            "isByeMatch": false,
            "status": "pending",
            "roundName": "Quarter-final",
            "previousBracketAId": 1,
            "previousBracketBId": 2,
            "nextBracketId": 13
          }
        ]
      },
      {
        "roundNumber": 2,
        "roundName": "Semi-final",
        "brackets": [...]
      },
      {
        "roundNumber": 1,
        "roundName": "Final",
        "brackets": [...]
      }
    ]
  }
}
```

> 📝 **Lưu ý về Response:**
> - `totalBrackets`: Tổng số bracket = bracketSize - 1 (ví dụ: bracket 16 có 15 brackets)
> - `numByes`: Số bye matches = bracketSize - numEntries
> - Brackets có `isByeMatch = true` chỉ có `entryAId`, `entryBId = null`
> - Brackets vòng sau có `status = "pending"` cho đến khi có winner từ vòng trước

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Tự động tạo **toàn bộ cấu trúc knockout bracket** dựa trên entries của tournament content.

**Khi nào sử dụng:**

- Tournament **KHÔNG có vòng bảng** (knockout trực tiếp từ đầu)
- Entries đã được đăng ký
- Cần setup bracket structure trước khi generate schedule

**Tính năng:**

- Tự động tính số vòng đấu dựa trên số entries
- Tạo bracket tree với linking (previousBracket, nextBracket)
- Xử lý **bye matches** khi entries không phải lũy thừa của 2
- Seeding tự động (hoặc theo thứ tự đăng ký)

### **Request Body**

| Field       | Type    | Required | Description           | Example |
| ----------- | ------- | -------- | --------------------- | ------- |
| `contentId` | integer | Yes      | Tournament Content ID | `1`     |

### **Request Example**

```json
{
  "contentId": 1
}
```

### **Response - 201 Created**

**Scenario: 8 entries → 3 rounds**

```json
{
  "success": true,
  "data": {
    "contentId": 1,
    "totalRounds": 3,
    "totalBrackets": 7,
    "rounds": [
      {
        "roundNumber": 3,
        "roundName": "Quarter-Final",
        "brackets": [
          {
            "id": 1,
            "contentId": 1,
            "roundNumber": 3,
            "bracketPosition": 0,
            "entryAId": 5,
            "entryBId": 12,
            "seedA": 1,
            "seedB": 8,
            "nextBracketId": 9,
            "status": "ready",
            "roundName": "Quarter-Final 1",
            "isByeMatch": false
          },
          {
            "id": 2,
            "contentId": 1,
            "roundNumber": 3,
            "bracketPosition": 1,
            "entryAId": 3,
            "entryBId": 9,
            "seedA": 4,
            "seedB": 5,
            "nextBracketId": 9,
            "status": "ready",
            "roundName": "Quarter-Final 2",
            "isByeMatch": false
          },
          {
            "id": 3,
            "contentId": 1,
            "roundNumber": 3,
            "bracketPosition": 2,
            "entryAId": 7,
            "entryBId": 15,
            "seedA": 2,
            "seedB": 7,
            "nextBracketId": 10,
            "status": "ready",
            "roundName": "Quarter-Final 3",
            "isByeMatch": false
          },
          {
            "id": 4,
            "contentId": 1,
            "roundNumber": 3,
            "bracketPosition": 3,
            "entryAId": 8,
            "entryBId": 11,
            "seedA": 3,
            "seedB": 6,
            "nextBracketId": 10,
            "status": "ready",
            "roundName": "Quarter-Final 4",
            "isByeMatch": false
          }
        ]
      },
      {
        "roundNumber": 2,
        "roundName": "Semi-Final",
        "brackets": [
          {
            "id": 9,
            "contentId": 1,
            "roundNumber": 2,
            "bracketPosition": 0,
            "entryAId": null,
            "entryBId": null,
            "nextBracketId": 15,
            "previousBracketAId": 1,
            "previousBracketBId": 2,
            "status": "pending",
            "roundName": "Semi-Final 1",
            "isByeMatch": false
          },
          {
            "id": 10,
            "contentId": 1,
            "roundNumber": 2,
            "bracketPosition": 1,
            "entryAId": null,
            "entryBId": null,
            "nextBracketId": 15,
            "previousBracketAId": 3,
            "previousBracketBId": 4,
            "status": "pending",
            "roundName": "Semi-Final 2",
            "isByeMatch": false
          }
        ]
      },
      {
        "roundNumber": 1,
        "roundName": "Final",
        "brackets": [
          {
            "id": 15,
            "contentId": 1,
            "roundNumber": 1,
            "bracketPosition": 0,
            "entryAId": null,
            "entryBId": null,
            "nextBracketId": null,
            "previousBracketAId": 9,
            "previousBracketBId": 10,
            "status": "pending",
            "roundName": "Final",
            "isByeMatch": false
          }
        ]
      }
    ]
  },
  "message": "Knockout bracket generated successfully"
}
```

**Logic tính số vòng:**

- 2 entries: 1 round (Final)
- 3-4 entries: 2 rounds (SF → Final)
- 5-8 entries: 3 rounds (QF → SF → Final)
- 9-16 entries: 4 rounds (R16 → QF → SF → Final)

### **Error Responses**

```json
{
  "success": false,
  "message": "Không có entries cho tournament content này"
}
```

---

## **8. Generate Bracket from Groups**

### **Endpoint**

```
POST /api/knockout-brackets/generate-from-groups
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Tạo nhánh đấu knockout từ kết quả vòng bảng.

**Quy tắc:**
1. Lấy **top 2 mỗi bảng** (nhất và nhì)
2. Chia đều bye matches vào 2 nhánh (top half và bottom half)
3. **Tất cả bye matches dành cho đội nhất bảng**
4. **Đội nhì bảng gặp đội nhất bảng khác** (không cùng bảng)
5. Cân bằng 2 nhánh đấu

**Xử lý Bye Matches:**
- Khi số entries qualified không phải lũy thừa của 2, tự động tạo bye matches
- Ví dụ: 4 bảng × 2 entries = 8 qualified → bracket size 8 → không cần bye
- Ví dụ: 3 bảng × 2 entries = 6 qualified → bracket size 8 → cần 2 bye matches
- Bye matches ưu tiên cho các đội nhất bảng (đội có thứ hạng cao hơn)
- Các bye matches được phân bổ ngẫu nhiên vào các vị trí vòng 1

### **Request Body**

| Field       | Type    | Required | Description                                      |
| ----------- | ------- | -------- | ------------------------------------------------ |
| `contentId` | integer | Yes      | Tournament content ID (phải có group standings đã hoàn thành) |

### **Request Example**

```json
{
  "contentId": 1
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Knockout bracket generated from groups successfully",
  "data": {
    "contentId": 1,
    "totalRounds": 3,
    "totalBrackets": 7,
    "bracketSize": 8,
    "numEntries": 6,
    "numByes": 2,
    "qualifiedEntries": [
      { "entryId": 1, "groupName": "Group A", "rank": 1 },
      { "entryId": 2, "groupName": "Group A", "rank": 2 },
      { "entryId": 5, "groupName": "Group B", "rank": 1 },
      { "entryId": 6, "groupName": "Group B", "rank": 2 },
      { "entryId": 9, "groupName": "Group C", "rank": 1 },
      { "entryId": 10, "groupName": "Group C", "rank": 2 }
    ],
    "rounds": [
      {
        "roundNumber": 3,
        "roundName": "Quarter-final",
        "brackets": [
          {
            "id": 1,
            "contentId": 1,
            "roundNumber": 3,
            "bracketPosition": 0,
            "entryAId": 1,
            "entryBId": null,
            "seedA": 1,
            "seedB": null,
            "isByeMatch": true,
            "status": "ready",
            "roundName": "Quarter-final",
            "nextBracketId": 5
          },
          {
            "id": 2,
            "contentId": 1,
            "roundNumber": 3,
            "bracketPosition": 1,
            "entryAId": 6,
            "entryBId": 5,
            "seedA": 2,
            "seedB": 1,
            "isByeMatch": false,
            "status": "ready",
            "roundName": "Quarter-final",
            "nextBracketId": 5
          }
        ]
      },
      {
        "roundNumber": 2,
        "roundName": "Semi-final",
        "brackets": [...]
      },
      {
        "roundNumber": 1,
        "roundName": "Final",
        "brackets": [...]
      }
    ]
  }
}
```

> 📌 **Giải thích seeding:**
> - `seedA`, `seedB`: Thứ hạng trong bảng (1 = nhất bảng, 2 = nhì bảng)
> - Các đội nhất bảng có bye matches và không gặp nhau ở vòng đầu
> - Đội nhì bảng sẽ gặp đội nhất bảng khác để tránh đối đầu cùng bảng sớm

### **Error Responses**

**400 Bad Request**

```json
{
  "success": false,
  "message": "Not enough completed group standings to generate knockout bracket"
}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Tạo knockout bracket từ **kết quả vòng bảng** đã được tính toán bởi API `/group-standings/calculate`.

**⚠️ Yêu cầu:**
- Vòng bảng (Group Stage) **đã hoàn tất**
- **Đã gọi API calculate** để tính xếp hạng bảng đấu
- Mỗi bảng đã có `position` (thứ hạng) cho từng entry

**Tính năng:**
- ✅ Tự động lấy **top 2 teams mỗi bảng** để vào knockout
- ✅ Tạo bracket structure với seeding hợp lý (A1 vs D2, B1 vs C2...)
- ✅ Set `status = ready` cho các bracket có đủ 2 entries
- ✅ Liên kết winner path (`nextBracketId`)

**Khi nào sử dụng:**
- Tournament **CÓ vòng bảng** trước knockout
- Sau khi đã gọi `/group-standings/calculate` để tính thứ hạng
- Cần chuyển từ group stage sang knockout stage

**Workflow đầy đủ:**
1. Vòng bảng kết thúc → Gọi `/matches/{id}/finalize` cho từng match
2. Tính xếp hạng → Gọi `/group-standings/calculate` với `contentId`
3. Tạo knockout bracket → Gọi API này `/knockout-brackets/generate-from-groups`
4. Tạo lịch knockout → Gọi `/schedules/generate-knockout-stage`
5. Thi đấu knockout → Gọi `/matches/{id}/start` và `/matches/{id}/finalize`

### **Request Body**

| Field       | Type    | Required | Description           | Example |
| ----------- | ------- | -------- | --------------------- | ------- |
| `contentId` | integer | Yes      | Tournament Content ID | `1`     |

### **Request Example**

```json
{
  "contentId": 1
}
```

### **Response - 201 Created**

**Scenario: 4 bảng, mỗi bảng 2 teams qualified → 8 teams knockout**

```json
{
  "success": true,
  "data": {
    "contentId": 1,
    "totalRounds": 3,
    "totalBrackets": 7,
    "qualifiedEntries": [
      { "groupName": "Bảng A", "position": 1, "entryId": 5 },
      { "groupName": "Bảng A", "position": 2, "entryId": 12 },
      { "groupName": "Bảng B", "position": 1, "entryId": 3 },
      { "groupName": "Bảng B", "position": 2, "entryId": 9 },
      { "groupName": "Bảng C", "position": 1, "entryId": 7 },
      { "groupName": "Bảng C", "position": 2, "entryId": 15 },
      { "groupName": "Bảng D", "position": 1, "entryId": 8 },
      { "groupName": "Bảng D", "position": 2, "entryId": 11 }
    ],
    "rounds": [
      {
        "roundNumber": 3,
        "roundName": "Quarter-Final",
        "brackets": [
          {
            "id": 1,
            "roundNumber": 3,
            "bracketPosition": 0,
            "entryAId": 5,
            "entryBId": 11,
            "seedA": 1,
            "seedB": 8,
            "nextBracketId": 9,
            "roundName": "Quarter-Final 1",
            "status": "ready"
          }
          // ... more QF brackets
        ]
      }
      // ... SF and Final
    ]
  },
  "message": "Knockout bracket generated from group stage results successfully"
}
```

**Seeding logic:**

- A1 vs D2
- B1 vs C2
- C1 vs B2
- D1 vs A2

### **Error Responses**

```json
{
  "success": false,
  "message": "Vòng bảng chưa có kết quả để tạo knockout bracket"
}
```

---

## **9. Advance Winner**

### **Endpoint**

```
POST /api/knockout-brackets/advance-winner
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Cập nhật winner và tự động advance entry sang bracket tiếp theo.

**Quy trình:**
1. Cập nhật `winnerEntryId` vào bracket hiện tại
2. Set bracket `status` = `completed`
3. Tìm `nextBracketId` (bracket vòng sau)
4. Cập nhật entry vào vị trí tương ứng trong bracket vòng sau
5. Nếu bracket vòng sau đã đủ 2 entries → set `status` = `ready`

**Xử lý Bye Matches:**
- Nếu bracket có `isByeMatch = true`, winner được tự động set là `entryAId`
- Bye match không cần match thực tế, entry tự động advance
- System có thể tự động advance winner của bye match khi tạo schedule

**Quy trình:**
1. Cập nhật `winnerEntryId` vào bracket hiện tại
2. Set bracket `status` = `completed`
3. Tìm `nextBracketId` (bracket vòng sau)
4. Cập nhật entry vào vị trí tương ứng trong bracket vòng sau
5. Nếu bracket vòng sau đã đủ 2 entries → set `status` = `ready`

**Xử lý Bye Matches:**
- Nếu bracket có `isByeMatch = true`, winner được tự động set là `entryAId`
- Bye match không cần match thực tế, entry tự động advance
- System có thể tự động advance winner của bye match khi tạo schedule

### **Request Body**

| Field           | Type    | Required | Description           |
| --------------- | ------- | -------- | --------------------- |
| `bracketId`     | integer | Yes      | ID của bracket hiện tại |
| `winnerEntryId` | integer | Yes      | ID của entry thắng    |

### **Request Example**

```json
{
  "bracketId": 1,
  "winnerEntryId": 5
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Winner advanced successfully",
  "data": {
    "currentBracket": {
      "id": 1,
      "contentId": 1,
      "roundNumber": 4,
      "bracketPosition": 0,
      "entryAId": 5,
      "entryBId": 8,
      "winnerEntryId": 5,
      "status": "completed",
      "isByeMatch": false,
      "nextBracketId": 9
    },
    "nextBracket": {
      "id": 9,
      "contentId": 1,
      "roundNumber": 3,
      "bracketPosition": 0,
      "entryAId": 5,
      "entryBId": null,
      "winnerEntryId": null,
      "status": "pending",
      "isByeMatch": false,
      "roundName": "Quarter-final"
    }
  }
}
```

> 📝 **Lưu ý:**
> - Nếu `nextBracket` vẫn `status = "pending"`, nghĩa là đang chờ kết quả từ bracket khác
> - Khi `nextBracket` có đủ 2 entries, `status` sẽ tự động chuyển sang `"ready"`
> - Winner của Final (roundNumber = 1) sẽ không có `nextBracketId`

### **Error Responses**

**400 Bad Request**

```json
{
  "success": false,
  "message": "Winner entry must be either entryAId or entryBId of this bracket"
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Bracket not found"
}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

**Advance winner** của một bracket sang vòng tiếp theo.

**Khi nào sử dụng:**

- Sau khi một match knockout kết thúc
- Đã xác định winner
- Cần update bracket vòng sau với winner này

**Tính năng:**

- Tự động tìm nextBracket
- Update entryAId hoặc entryBId của nextBracket
- Update status bracket hiện tại thành "completed"
- Nếu nextBracket đã có đủ 2 entries → status = "ready"

### **Request Body**

| Field           | Type    | Required | Description                 | Example |
| --------------- | ------- | -------- | --------------------------- | ------- |
| `bracketId`     | integer | Yes      | ID của bracket vừa kết thúc | `1`     |
| `winnerEntryId` | integer | Yes      | ID của entry thắng          | `5`     |

### **Request Example**

```json
{
  "bracketId": 1,
  "winnerEntryId": 5
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Winner updated and advanced to the next round successfully"
}
```

**Side effects:**

1. Bracket 1: `winnerEntryId = 5`, `status = "completed"`
2. Next bracket (e.g., bracket 9):
   - `entryAId = 5` (nếu bracket 1 là previousBracketAId)
   - `status = "ready"` (nếu đã có entryBId)

### **Error Responses**

**400 Bad Request**

```json
{
  "success": false,
  "message": "Invalid winner entry ID"
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Bracket not found"
}
```

---

## **Important Notes cho Frontend**

### **1. Workflow setup knockout bracket**

```javascript
// Scenario 1: Tournament KHÔNG có vòng bảng
const setupDirectKnockout = async (contentId) => {
  // Generate bracket structure
  const bracket = await fetch("/api/knockout-brackets/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  }).then((r) => r.json());

  console.log("Bracket created:", bracket.data.totalBrackets, "brackets");

  // Generate knockout schedule
  await fetch("/api/schedules/generate-knockout-only", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  });

  return bracket.data;
};

// Scenario 2: Tournament CÓ vòng bảng
const setupKnockoutFromGroups = async (contentId) => {
  // 1. Vòng bảng phải hoàn tất trước
  // 2. Calculate standings
  await fetch("/api/group-standings/calculate-standings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  });

  // 3. Generate bracket from qualified teams
  const bracket = await fetch("/api/knockout-brackets/generate-from-groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  }).then((r) => r.json());

  // 4. Generate knockout schedule
  await fetch("/api/schedules/generate-knockout-only", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  });

  return bracket.data;
};
```

### **2. Display bracket tree visualization**

```javascript
const displayBracketTree = async (contentId) => {
  const response = await fetch(`/api/knockout-brackets/content/${contentId}`);
  const { data: brackets } = await response.json();

  // Group by round
  const rounds = {};
  brackets.forEach((b) => {
    if (!rounds[b.roundNumber]) {
      rounds[b.roundNumber] = [];
    }
    rounds[b.roundNumber].push(b);
  });

  // Display from last round to final
  const sortedRounds = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => b - a); // 3, 2, 1

  sortedRounds.forEach((roundNum) => {
    console.log(`\n${rounds[roundNum][0].roundName}:`);
    rounds[roundNum].forEach((bracket, idx) => {
      const entryA = bracket.entry_a?.team?.name || "TBD";
      const entryB = bracket.entry_b?.team?.name || "TBD";
      const winner = bracket.winnerEntryId
        ? bracket.winnerEntryId === bracket.entryAId
          ? entryA
          : entryB
        : "Pending";

      console.log(
        `  Match ${idx + 1}: ${entryA} vs ${entryB} → Winner: ${winner}`,
      );
    });
  });
};

// Example output:
// Quarter-Final:
//   Match 1: Team Alpha vs Team Omega → Winner: Team Alpha
//   Match 2: Team Beta vs Team Gamma → Winner: Team Gamma
//   Match 3: Team Delta vs Team Sigma → Winner: Team Delta
//   Match 4: Team Epsilon vs Team Zeta → Winner: Team Epsilon
//
// Semi-Final:
//   Match 1: Team Alpha vs Team Gamma → Winner: Pending
//   Match 2: Team Delta vs Team Epsilon → Winner: Pending
//
// Final:
//   Match 1: TBD vs TBD → Winner: Pending
```

### **3. Auto-advance winner after match completion**

```javascript
const onKnockoutMatchCompleted = async (matchId, bracketId, winnerId) => {
  // 1. Update match with winner
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

  // 2. Advance winner to next bracket
  await fetch("/api/knockout-brackets/advance-winner", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bracketId,
      winnerEntryId: winnerId,
    }),
  });

  // 3. Check if next bracket is ready
  const currentBracket = await fetch(
    `/api/knockout-brackets/${bracketId}`,
  ).then((r) => r.json());

  if (currentBracket.data.nextBracketId) {
    const nextBracket = await fetch(
      `/api/knockout-brackets/${currentBracket.data.nextBracketId}`,
    ).then((r) => r.json());

    if (nextBracket.data.status === "ready") {
      console.log("Next match is ready to be scheduled!");
      // Optionally generate schedule for next match
    }
  } else {
    console.log("Tournament completed! This was the final match.");
  }
};
```

### **4. Handling bye matches**

```javascript
const handleByeMatch = (bracket) => {
  if (bracket.isByeMatch) {
    // Tự động advance entry vào vòng sau
    const advancingEntry = bracket.entryAId || bracket.entryBId;

    if (advancingEntry) {
      fetch("/api/knockout-brackets/advance-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bracketId: bracket.id,
          winnerEntryId: advancingEntry,
        }),
      });
    }
  }
};

// Process all bye matches
const processAllByeMatches = async (contentId) => {
  const response = await fetch(`/api/knockout-brackets/content/${contentId}`);
  const { data: brackets } = await response.json();

  const byeMatches = brackets.filter((b) => b.isByeMatch);

  for (const bye of byeMatches) {
    await handleByeMatch(bye);
  }

  console.log(`Processed ${byeMatches.length} bye matches`);
};
```

### **5. Calculate tournament champion**

```javascript
const getTournamentChampion = async (contentId) => {
  const response = await fetch(`/api/knockout-brackets/content/${contentId}`);
  const { data: brackets } = await response.json();

  // Find final bracket (roundNumber = 1)
  const finalBracket = brackets.find((b) => b.roundNumber === 1);

  if (!finalBracket) {
    return { status: "no_final", message: "Final bracket not found" };
  }

  if (finalBracket.status !== "completed") {
    return {
      status: "in_progress",
      message: "Tournament still in progress",
      finalReady: finalBracket.status === "ready",
    };
  }

  // Get champion info
  const championId = finalBracket.winnerEntryId;
  const runnerUpId =
    finalBracket.entryAId === championId
      ? finalBracket.entryBId
      : finalBracket.entryAId;

  return {
    status: "completed",
    champion: {
      entryId: championId,
      entry:
        finalBracket.winnerEntryId === finalBracket.entryAId
          ? finalBracket.entry_a
          : finalBracket.entry_b,
    },
    runnerUp: {
      entryId: runnerUpId,
      entry:
        finalBracket.entryAId === runnerUpId
          ? finalBracket.entry_a
          : finalBracket.entry_b,
    },
  };
};

// Usage
const result = await getTournamentChampion(1);
if (result.status === "completed") {
  console.log("🏆 Champion:", result.champion.entry.team.name);
  console.log("🥈 Runner-up:", result.runnerUp.entry.team.name);
}
```

### **6. Validation Rules**

- `roundNumber` càng nhỏ càng gần final (1 = Final, 2 = SF, 3 = QF...)
- Mỗi bracket phải có `nextBracketId` (trừ Final)
- `previousBracketAId` và `previousBracketBId` phải point đến 2 brackets khác nhau
- Winner chỉ có thể là `entryAId` hoặc `entryBId`
- Bracket status: `pending` → `ready` → `in_progress` → `completed`

### **7. Best Practices**

✅ **Nên:**

- Sử dụng `generate` API thay vì tạo thủ công
- Auto-advance winner sau match completion
- Process bye matches trước khi generate schedule
- Cache bracket structure để hiển thị nhanh
- Visualize bracket tree theo rounds

❌ **Không nên:**

- Manual create brackets (dùng generate API)
- Skip bye match processing
- Update winner mà không advance
- Hardcode round names (dùng từ API)

---

## **TypeScript Interfaces**

```typescript
// Knockout Bracket Model
interface KnockoutBracket {
  id: number;
  contentId: number;
  roundNumber: number;
  bracketPosition: number;
  scheduleId?: number;
  matchId?: number;
  entryAId?: number;
  entryBId?: number;
  winnerEntryId?: number;
  seedA?: number;
  seedB?: number;
  nextBracketId?: number;
  previousBracketAId?: number;
  previousBracketBId?: number;
  status: "pending" | "ready" | "in_progress" | "completed";
  roundName?: string;
  isByeMatch: boolean;
  createdAt: string;
  updatedAt: string;
  entry_a?: {
    id: number;
    team: { name: string };
  };
  entry_b?: {
    id: number;
    team: { name: string };
  };
}

// Create Request
interface CreateKnockoutBracketRequest {
  contentId: number;
  roundNumber: number;
  bracketPosition: number;
  entryAId?: number;
  entryBId?: number;
  seedA?: number;
  seedB?: number;
  nextBracketId?: number;
  previousBracketAId?: number;
  previousBracketBId?: number;
  roundName?: string;
  isByeMatch?: boolean;
}

// Update Request
interface UpdateKnockoutBracketRequest {
  scheduleId?: number;
  matchId?: number;
  entryAId?: number;
  entryBId?: number;
  winnerEntryId?: number;
  status?: "pending" | "ready" | "in_progress" | "completed";
}

// Generate Bracket Request
interface GenerateBracketRequest {
  contentId: number;
}

// Generate Bracket Response
interface GenerateBracketResponse {
  contentId: number;
  totalRounds: number;
  totalBrackets: number;
  rounds: Round[];
}

interface Round {
  roundNumber: number;
  roundName: string;
  brackets: KnockoutBracket[];
}

// Advance Winner Request
interface AdvanceWinnerRequest {
  bracketId: number;
  winnerEntryId: number;
}

// Tournament Champion Response
interface TournamentChampion {
  status: "completed" | "in_progress" | "no_final";
  champion?: {
    entryId: number;
    entry: {
      team: { name: string };
    };
  };
  runnerUp?: {
    entryId: number;
    entry: {
      team: { name: string };
    };
  };
}
```

---

## **Common Use Cases**

### **Use Case 1: Setup tournament with direct knockout (no group stage)**

```javascript
const setupDirectKnockoutTournament = async (contentId) => {
  console.log("Step 1: Generate bracket structure...");
  const bracket = await fetch("/api/knockout-brackets/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  }).then((r) => r.json());

  console.log(
    `✓ Created ${bracket.data.totalBrackets} brackets in ${bracket.data.totalRounds} rounds`,
  );

  console.log("Step 2: Generate knockout schedule...");
  await fetch("/api/schedules/generate-knockout-only", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  });

  console.log("✓ Tournament setup completed!");
  return bracket.data;
};
```

### **Use Case 2: Setup knockout stage after group stage**

```javascript
const transitionToKnockoutStage = async (contentId) => {
  console.log("Step 1: Calculate final group standings...");
  await fetch("/api/group-standings/calculate-standings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  });

  console.log("Step 2: Get qualified teams...");
  const qualified = await fetch(
    `/api/group-standings/qualified/${contentId}?teamsPerGroup=2`,
  ).then((r) => r.json());

  console.log(`✓ ${qualified.data.totalQualified} teams qualified`);

  console.log("Step 3: Generate knockout bracket...");
  const bracket = await fetch("/api/knockout-brackets/generate-from-groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  }).then((r) => r.json());

  console.log("Step 4: Generate knockout schedule...");
  await fetch("/api/schedules/generate-knockout-only", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  });

  console.log("✓ Knockout stage ready!");
  return bracket.data;
};
```

### **Use Case 3: Real-time bracket progression**

```javascript
const trackBracketProgression = async (contentId) => {
  const response = await fetch(`/api/knockout-brackets/content/${contentId}`);
  const { data: brackets } = await response.json();

  // Calculate progress
  const total = brackets.length;
  const completed = brackets.filter((b) => b.status === "completed").length;
  const inProgress = brackets.filter((b) => b.status === "in_progress").length;
  const ready = brackets.filter((b) => b.status === "ready").length;
  const pending = brackets.filter((b) => b.status === "pending").length;

  return {
    total,
    completed,
    inProgress,
    ready,
    pending,
    progressPercent: Math.round((completed / total) * 100),
    currentRound: getCurrentRound(brackets),
    nextMatches: brackets.filter((b) => b.status === "ready"),
  };
};

const getCurrentRound = (brackets) => {
  const inProgress = brackets.filter(
    (b) => b.status === "in_progress" || b.status === "ready",
  );

  if (inProgress.length === 0) {
    const completed = brackets.filter((b) => b.status === "completed");
    if (completed.length === brackets.length) {
      return "Tournament Completed";
    }
    return "Not Started";
  }

  const maxRound = Math.max(...inProgress.map((b) => b.roundNumber));
  const roundBracket = brackets.find((b) => b.roundNumber === maxRound);
  return roundBracket?.roundName || `Round ${maxRound}`;
};

// Display progress
const progress = await trackBracketProgression(1);
console.log(`Progress: ${progress.progressPercent}%`);
console.log(`Current Round: ${progress.currentRound}`);
console.log(`Next Matches: ${progress.nextMatches.length}`);
```

### **Use Case 4: Complete match and advance winner**

```javascript
const completeKnockoutMatch = async (matchId, bracketId, contentId) => {
  // 1. Get match details
  const match = await fetch(`/api/matches/${matchId}`).then((r) => r.json());

  // 2. Calculate winner from match sets
  const sets = await fetch(`/api/match-sets/match/${matchId}`).then((r) =>
    r.json(),
  );

  let entryAWins = 0;
  let entryBWins = 0;
  sets.forEach((set) => {
    if (set.entryAScore > set.entryBScore) entryAWins++;
    else if (set.entryBScore > set.entryAScore) entryBWins++;
  });

  const winnerId = entryAWins > entryBWins ? match.entryAId : match.entryBId;

  // 3. Update match with winner
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

  // 4. Advance winner
  await fetch("/api/knockout-brackets/advance-winner", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bracketId, winnerEntryId: winnerId }),
  });

  // 5. Check tournament status
  const champion = await getTournamentChampion(contentId);

  if (champion.status === "completed") {
    console.log("🏆 Tournament completed!");
    console.log("Champion:", champion.champion.entry.team.name);
  } else {
    console.log("✓ Winner advanced to next round");
  }
};
```
