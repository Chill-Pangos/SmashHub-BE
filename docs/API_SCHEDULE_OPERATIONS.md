# 📘 API Documentation - Schedule Operations

Tài liệu này mô tả các API để **quản lý lịch thi đấu (schedules)** trong tournaments.

> 📝 **Lưu ý quan trọng:**
>
> - API tạo lịch chỉ cần **contentId** là sẽ tự động tạo **full lịch** cho toàn bộ giải đấu
> - Hệ thống sẽ tự động phân bổ thời gian, bàn thi đấu dựa trên số lượng entries
> - Hỗ trợ cả vòng bảng (group stage) và vòng loại trực tiếp (knockout stage)

---

## **Table of Contents**

1. [Get All Schedules](#1-get-all-schedules)
2. [Get Schedule by ID](#2-get-schedule-by-id)
3. [Generate Schedule](#3-generate-schedule)
4. [Update Knockout Entries](#4-update-knockout-entries)
5. [Generate Group Stage Schedule](#5-generate-group-stage-schedule)
6. [Generate Complete Schedule](#6-generate-complete-schedule)
7. [Generate Knockout Only Schedule](#7-generate-knockout-only-schedule)
8. [Generate Knockout Stage Schedule](#8-generate-knockout-stage-schedule)
9. [Update Schedule](#9-update-schedule)
10. [Delete Schedule](#10-delete-schedule)

---

## **1. Get All Schedules**

### **Endpoint**

```
GET /api/schedules
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tất cả schedules, được sắp xếp theo thời gian thi đấu.

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/schedules?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "contentId": 1,
    "roundNumber": 1,
    "groupName": "Group A",
    "stage": "group",
    "knockoutRound": null,
    "tableNumber": 1,
    "scheduledAt": "2026-03-15T09:00:00.000Z",
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T10:00:00.000Z"
  },
  {
    "id": 2,
    "contentId": 1,
    "roundNumber": 1,
    "groupName": null,
    "stage": "knockout",
    "knockoutRound": "Round of 16",
    "tableNumber": 2,
    "scheduledAt": "2026-03-16T14:00:00.000Z",
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T10:00:00.000Z"
  }
]
```

### **Error Responses**

```json
{
  "message": "Error fetching schedules",
  "error": {}
}
```

---

## **2. Get Schedule by ID**

### **Endpoint**

```
GET /api/schedules/{id}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin chi tiết của một schedule theo ID.

### **Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Schedule ID |

### **Request Example**

```http
GET /api/schedules/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "contentId": 1,
  "roundNumber": 1,
  "groupName": "Group A",
  "stage": "group",
  "knockoutRound": null,
  "tableNumber": 1,
  "scheduledAt": "2026-03-15T09:00:00.000Z",
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T10:00:00.000Z"
}
```

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Schedule not found"
}
```

---

## **3. Generate Schedule (Not Implemented)**

### **Endpoint**

```
POST /api/schedules/generate
```

### **Authentication**

✅ **Required**

### **Description**

⚠️ **Not Implemented** - Use `/schedules/generate-group-stage` endpoint instead.

Tự động tạo schedules cho tournament dựa trên matches đã có. API này sẽ phân bổ thời gian và bàn thi đấu tự động.

### **Request Body**

| Field       | Type    | Required | Description                |
| ----------- | ------- | -------- | -------------------------- |
| `contentId` | integer | Yes      | Tournament content ID      |
| `startDate` | string  | Yes      | Ngày bắt đầu (YYYY-MM-DD)  |
| `endDate`   | string  | Yes      | Ngày kết thúc (YYYY-MM-DD) |

### **Response - 501 Not Implemented**

```json
{
  "success": false,
  "message": "Not implemented. Use /generate-group-stage endpoint instead."
}
```

### **Request Example**

```json
{
  "contentId": 1,
  "startDate": "2024-12-25",
  "endDate": "2024-12-27"
}
```

### **Response Example**

```json
{
  "success": true,
  "message": "Schedules generated successfully",
  "data": {
    "schedulesCreated": 24,
    "matchesAssigned": 24
  }
}
```

---

## **4. Update Knockout Entries (Not Implemented)**

### **Endpoint**

```
POST /api/schedules/update-knockout
```

### **Authentication**

✅ **Required**

### **Description**

Cập nhật entries cho knockout stage matches sau khi vòng bảng kết thúc. API này sẽ lấy các đội đứng đầu từ mỗi bảng và assign vào knockout brackets.

### **Request Body**

| Field          | Type    | Required | Description                                          |
| -------------- | ------- | -------- | ---------------------------------------------------- |
| `contentId`    | integer | Yes      | Tournament content ID                                |
| `groupResults` | array   | Yes      | Mảng kết quả từng bảng với danh sách qualified teams |

### **Request Example**

```json
{
  "contentId": 1,
  "groupResults": [
    {
      "groupName": "Group A",
      "qualifiedEntryIds": [1, 2]
    },
    {
      "groupName": "Group B",
      "qualifiedEntryIds": [5, 6]
    }
  ]
}
```

### **Response Example**

```json
{
  "success": true,
  "message": "Knockout entries updated successfully",
  "data": {
    "matchesUpdated": 8,
    "round": "Round of 16"
  }
}
```

---

## **5. Generate Group Stage Schedule**

### **Endpoint**

```
POST /api/schedules/generate-group-stage
```

### **Authentication**

✅ **Required**

### **Description**

Tạo schedule cho vòng bảng dựa trên group standings đã có.

**Điều kiện:**
- Khung giờ: 8h-11h30 (sáng), 13h30-17h (chiều), 18h30-22h (tối)
- Thời gian mỗi trận: Single/Double 30 phút, Team 60 phút
- Các đội không đấu liên tiếp 2 trận trong cùng buổi
- Round-robin: Tất cả đội đấu với nhau trong mỗi bảng

### **Request Body**

| Field       | Type    | Required | Description                      |
| ----------- | ------- | -------- | -------------------------------- |
| `contentId` | integer | Yes      | Tournament content ID            |
| `startDate` | string  | Yes      | Ngày bắt đầu thi đấu (YYYY-MM-DD) |

### **Request Example**

```json
{
  "contentId": 1,
  "startDate": "2026-02-01"
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Group stage schedules generated successfully",
  "data": {
    "totalSchedules": 24,
    "totalMatches": 24,
    "schedules": [...],
    "matches": [...]
  }
}
```

### **Authentication**

✅ **Required**

### **Description**

Tạo schedules cho vòng bảng dựa trên group standings đã có. API này chỉ tạo lịch cho vòng bảng, không tạo knockout.

### **⚠️ Điều kiện:**

- Phải đã có group standings (entries đã được chia bảng)
- Tournament content phải có `isGroupStage = true`

### **Request Body**

| Field       | Type    | Required | Description           |
| ----------- | ------- | -------- | --------------------- |
| `contentId` | integer | Yes      | Tournament content ID |

### **Request Example**

```json
{
  "contentId": 1
}
```

### **Response Example**

```json
{
  "success": true,
  "message": "Group stage schedules generated successfully",
  "data": {
    "groupSchedules": 16,
    "groupMatches": 16,
    "groups": ["Group A", "Group B", "Group C", "Group D"]
  }
}
```

---

## **6. Generate Complete Schedule**

### **Endpoint**

```
POST /api/schedules/generate-complete
```

### **Authentication**

✅ **Required**

### **Description**

Tạo lịch thi đấu hoàn chỉnh cho tournament content bao gồm:
1. Chia entries thành bảng đấu (nếu chưa có)
2. Tạo knockout brackets từ top 2 mỗi bảng
3. Tạo schedules cho vòng bảng (max 2 trận/ngày)
4. Tạo schedules cho vòng knockout (max 3 trận/ngày, mỗi buổi 1 trận)
5. Đảm bảo kết thúc vòng bảng trước khi bắt đầu knockout

**Điều kiện:**
- Khung giờ: 8h-11h30 (sáng), 13h30-17h (chiều), 18h30-22h (tối)
- Thời gian mỗi trận: Single/Double 30 phút, Team 90 phút
- Không đấu liên tiếp trong cùng buổi
- Hỗ trợ nhiều bàn thi đấu song song
- Tự động tính toán và validate thời gian

### **Request Body**

| Field       | Type    | Required | Description                                                                    |
| ----------- | ------- | -------- | ------------------------------------------------------------------------------ |
| `contentId` | integer | Yes      | Tournament content ID (startDate và endDate sẽ được lấy từ tournament table) |

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
  "message": "Complete schedule generated successfully",
  "data": {
    "groupStandings": 16,
    "groupSchedules": 24,
    "groupMatches": 24,
    "knockoutBrackets": 7,
    "knockoutSchedules": 7,
    "knockoutMatches": 7
  }
}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication trong production)

### **Description**

🎯 **API QUAN TRỌNG** - Tự động tạo **TOÀN BỘ** lịch thi đấu cho một tournament content, bao gồm:

1. **Vòng bảng (Group Stage):**
   - Tự động phân chia entries vào các bảng đấu
   - Tạo lịch round-robin cho mỗi bảng (mọi đội gặp nhau 1 lần)
   - Phân bổ thời gian và bàn thi đấu hợp lý

2. **Vòng loại trực tiếp (Knockout Stage):**
   - Tự động lấy các đội đứng đầu mỗi bảng
   - Tạo nhánh đấu knockout (Round of 16, Quarter-finals, Semi-finals, Final)
   - Sắp xếp lịch thi đấu tiếp theo sau vòng bảng

### **⚠️ Điều kiện sử dụng:**

- Tournament content phải có `isGroupStage = true`
- Phải có đủ entries đã đăng ký
- Tối thiểu 12 entries để tạo lịch hợp lý

### **Request Body**

#### **Required Fields:**

| Field       | Type              | Description                            | Example                      |
| ----------- | ----------------- | -------------------------------------- | ---------------------------- |
| `contentId` | integer           | ID của tournament content cần tạo lịch | `1`                          |
| `startDate` | string (ISO 8601) | Ngày bắt đầu vòng bảng                 | `"2026-03-15T08:00:00.000Z"` |
| `endDate`   | string (ISO 8601) | Ngày dự kiến kết thúc giải đấu         | `"2026-03-20T18:00:00.000Z"` |

### **Request Example**

```json
{
  "contentId": 1,
  "startDate": "2026-03-15T08:00:00.000Z",
  "endDate": "2026-03-20T18:00:00.000Z"
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Complete schedule generated successfully",
  "data": {
    "groupStage": {
      "totalMatches": 48,
      "groups": ["Group A", "Group B", "Group C", "Group D"],
      "schedules": [
        {
          "id": 1,
          "contentId": 1,
          "roundNumber": 1,
          "groupName": "Group A",
          "stage": "group",
          "tableNumber": 1,
          "scheduledAt": "2026-03-15T09:00:00.000Z"
        }
      ]
    },
    "knockoutStage": {
      "totalMatches": 15,
      "rounds": ["Round of 16", "Quarter-finals", "Semi-finals", "Final"],
      "schedules": [
        {
          "id": 49,
          "contentId": 1,
          "roundNumber": 1,
          "stage": "knockout",
          "knockoutRound": "Round of 16",
          "tableNumber": 1,
          "scheduledAt": "2026-03-18T09:00:00.000Z"
        }
      ]
    }
  }
}
```

### **Response Structure**

| Field                        | Type    | Description                               |
| ---------------------------- | ------- | ----------------------------------------- |
| `groupStage.totalMatches`    | integer | Tổng số trận đấu vòng bảng                |
| `groupStage.groups`          | array   | Danh sách tên các bảng (Group A, B, C...) |
| `groupStage.schedules`       | array   | Danh sách lịch thi đấu vòng bảng          |
| `knockoutStage.totalMatches` | integer | Tổng số trận đấu vòng knockout            |
| `knockoutStage.rounds`       | array   | Danh sách các vòng đấu                    |
| `knockoutStage.schedules`    | array   | Danh sách lịch thi đấu vòng knockout      |

### **Error Responses**

**400 Bad Request** - Thiếu dữ liệu hoặc dữ liệu không hợp lệ

```json
{
  "success": false,
  "message": "Content ID, start date and end date are required"
}
```

**400 Bad Request** - Content không phải vòng bảng

```json
{
  "success": false,
  "message": "This content does not have group stage"
}
```

**400 Bad Request** - Không đủ entries

```json
{
  "success": false,
  "message": "Not enough entries to generate schedule"
}
```

---

## **7. Generate Knockout Only Schedule**

### **Endpoint**

```
POST /api/schedules/generate-knockout-only
```

### **Authentication**

✅ **Required**

### **Description**

Tạo lịch thi đấu cho tournament content chỉ có knockout stage (không qua vòng bảng):
1. Tạo knockout brackets trực tiếp từ entries (nếu chưa có)
2. Tạo schedules cho tất cả các vòng knockout
3. Hỗ trợ placeholder cho các vòng sau

**Điều kiện:**
- Khung giờ: 8h-11h30 (sáng), 13h30-17h (chiều), 18h30-22h (tối)
- Thời gian mỗi trận: Single/Double 30 phút, Team 90 phút
- Max 3 trận/ngày cho mỗi entry
- Không đấu liên tiếp trong cùng buổi
- Hỗ trợ nhiều bàn thi đấu song song
- startDate và endDate lấy từ tournament table

### **Request Body**

| Field       | Type    | Required | Description                                        |
| ----------- | ------- | -------- | -------------------------------------------------- |
| `contentId` | integer | Yes      | Tournament content ID (phải có isGroupStage = false) |

### **Request Example**

```json
{
  "contentId": 2
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Knockout-only schedule generated successfully",
  "data": {
    "knockoutBrackets": 15,
    "knockoutSchedules": 15,
    "knockoutMatches": 15
  }
}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication trong production)

### **Description**

🎯 **API cho giải không có vòng bảng** - Tự động tạo lịch thi đấu **CHỈ VÒNG LOẠI TRỰC TIẾP** cho tournament content.

**Sử dụng khi:**

- Tournament content có `isGroupStage = false` (không có vòng bảng)
- Muốn tạo giải đấu knockout đơn thuần
- Tất cả entries thi đấu trực tiếp theo nhánh

**Hệ thống sẽ:**

1. Lấy tất cả entries đã đăng ký
2. Tạo nhánh đấu knockout cân bằng
3. Sắp xếp lịch thi đấu theo thứ tự vòng (R64 → R32 → R16 → QF → SF → F)
4. Phân bổ thời gian và bàn thi đấu

### **⚠️ Điều kiện sử dụng:**

- Tournament content phải có `isGroupStage = false`
- Tối thiểu 12 entries
- Số lượng entries sẽ được làm tròn lên lũy thừa của 2 gần nhất (16, 32, 64...)
- Các vị trí trống sẽ được đánh dấu là "bye" (tự động thắng)

### **Request Body**

#### **Required Fields:**

| Field       | Type    | Description                            | Example |
| ----------- | ------- | -------------------------------------- | ------- |
| `contentId` | integer | ID của tournament content cần tạo lịch | `1`     |

### **Request Example**

```json
{
  "contentId": 2
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Knockout-only schedule generated successfully",
  "data": {
    "totalMatches": 15,
    "totalEntries": 16,
    "bracketSize": 16,
    "rounds": ["Round of 16", "Quarter-finals", "Semi-finals", "Final"],
    "schedules": [
      {
        "id": 1,
        "contentId": 2,
        "roundNumber": 1,
        "stage": "knockout",
        "knockoutRound": "Round of 16",
        "tableNumber": 1,
        "scheduledAt": "2026-03-15T09:00:00.000Z"
      },
      {
        "id": 2,
        "contentId": 2,
        "roundNumber": 1,
        "stage": "knockout",
        "knockoutRound": "Round of 16",
        "tableNumber": 2,
        "scheduledAt": "2026-03-15T09:30:00.000Z"
      }
    ]
  }
}
```

### **Response Structure**

| Field          | Type    | Description                          |
| -------------- | ------- | ------------------------------------ |
| `totalMatches` | integer | Tổng số trận đấu (bracketSize - 1)   |
| `totalEntries` | integer | Tổng số entries tham gia             |
| `bracketSize`  | integer | Kích thước nhánh đấu (16, 32, 64...) |
| `rounds`       | array   | Danh sách các vòng đấu               |
| `schedules`    | array   | Danh sách lịch thi đấu đã được tạo   |

### **Error Responses**

**400 Bad Request** - Thiếu contentId

```json
{
  "success": false,
  "message": "Content ID is required"
}
```

**400 Bad Request** - Content có vòng bảng

```json
{
  "success": false,
  "message": "This content has group stage. Use generate-complete instead."
}
```

**400 Bad Request** - Không đủ entries

```json
{
  "success": false,
  "message": "Minimum 12 entries required for knockout stage",
  "currentEntries": 8
}
```

---

## **8. Generate Knockout Stage Schedule**

### **Endpoint**

```
POST /api/schedules/generate-knockout-stage
```

### **Authentication**

✅ **Required**

### **Description**

Tạo schedule cho vòng knockout dựa trên knockout brackets đã được tạo từ group stage.

**Điều kiện:**
- Khung giờ: 8h-11h30 (sáng), 13h30-17h (chiều), 18h30-22h (tối)
- Thời gian mỗi trận: Single/Double 30 phút, Team 90 phút
- Các đội không đấu liên tiếp 2 trận trong cùng buổi
- Mỗi entry tối đa 2 trận/ngày
- Hỗ trợ nhiều bàn thi đấu song song
- Xếp lịch theo từng vòng: R16, QF, SF, Final

### **Request Body**

| Field       | Type    | Required | Description                                           |
| ----------- | ------- | -------- | ----------------------------------------------------- |
| `contentId` | integer | Yes      | Tournament content ID (phải có knockout brackets đã tạo) |
| `startDate` | string  | Yes      | Ngày bắt đầu vòng knockout (YYYY-MM-DD)              |

### **Request Example**

```json
{
  "contentId": 1,
  "startDate": "2026-02-10"
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Knockout stage schedules generated successfully",
  "data": {
    "totalSchedules": 7,
    "totalMatches": 7,
    "schedules": [
      {
        "id": 25,
        "contentId": 1,
        "stage": "knockout",
        "knockoutRound": "Semi-final",
        "scheduledAt": "2026-02-10T08:00:00.000Z",
        "tableNumber": 1
      }
    ],
    "matches": [
      {
        "id": 25,
        "scheduleId": 25,
        "entryAId": 5,
        "entryBId": 8,
        "status": "scheduled"
      }
    ]
  }
}
```

### **Authentication**

✅ **Required**

### **Description**

Tạo schedules cho vòng knockout dựa trên knockout brackets đã có. API này chỉ tạo lịch cho knockout stage, không tạo group stage.

### **⚠️ Điều kiện:**

- Phải đã có knockout brackets được tạo sẵn
- Vòng bảng phải đã hoàn thành (nếu có)

### **Request Body**

| Field       | Type    | Required | Description           |
| ----------- | ------- | -------- | --------------------- |
| `contentId` | integer | Yes      | Tournament content ID |

### **Request Example**

```json
{
  "contentId": 1
}
```

### **Response Example**

```json
{
  "success": true,
  "message": "Knockout stage schedules generated successfully",
  "data": {
    "knockoutSchedules": 8,
    "knockoutMatches": 8,
    "rounds": ["Round of 16", "Quarter-finals", "Semi-finals", "Final"]
  }
}
```

---

## **9. Update Schedule (Not Implemented)**

### **Endpoint**

```
PUT /api/schedules/{id}
```

### **Authentication**

✅ **Required**

### **Description**

⚠️ **Not Implemented**

### **Response - 501 Not Implemented**

```json
{
  "success": false,
  "message": "Not implemented"
}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Cập nhật thông tin một schedule (chủ yếu để điều chỉnh thời gian hoặc bàn thi đấu).

### **Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Schedule ID |

### **Request Body**

Tất cả fields đều **optional** - chỉ gửi những gì cần update.

| Field           | Type              | Description                 | Example                      |
| --------------- | ----------------- | --------------------------- | ---------------------------- |
| `scheduledAt`   | string (ISO 8601) | Thời gian thi đấu mới       | `"2026-03-15T10:00:00.000Z"` |
| `tableNumber`   | integer           | Số bàn thi đấu              | `3`                          |
| `roundNumber`   | integer           | Vòng đấu số mấy             | `2`                          |
| `groupName`     | string            | Tên bảng (nếu là vòng bảng) | `"Group B"`                  |
| `stage`         | enum string       | Giai đoạn                   | `"knockout"`                 |
| `knockoutRound` | string            | Tên vòng knockout           | `"Semi-finals"`              |

**Stage enum:** `group`, `knockout`

### **Request Example**

```json
{
  "scheduledAt": "2026-03-15T11:00:00.000Z",
  "tableNumber": 2
}
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "contentId": 1,
  "roundNumber": 1,
  "groupName": "Group A",
  "stage": "group",
  "tableNumber": 2,
  "scheduledAt": "2026-03-15T11:00:00.000Z",
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T11:30:00.000Z"
}
```

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Schedule not found"
}
```

---

## **10. Delete Schedule (Not Implemented)**

### **Endpoint**

```
DELETE /api/schedules/{id}
```

### **Authentication**

✅ **Required**

### **Description**

⚠️ **Not Implemented**

### **Response - 501 Not Implemented**

```json
{
  "success": false,
  "message": "Not implemented"
}
```

---

## **11. Get Schedules by Content ID**

### **Endpoint**

```
GET /api/schedules/content/{contentId}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy tất cả schedules của một tournament content, có thể filter theo stage.

### **Path Parameters**

| Parameter   | Type    | Required | Description           |
| ----------- | ------- | -------- | --------------------- |
| `contentId` | integer | Yes      | Tournament content ID |

### **Query Parameters**

| Parameter | Type   | Required | Default | Description                      |
| --------- | ------ | -------- | ------- | -------------------------------- |
| `stage`   | string | No       | -       | Filter by stage (group/knockout) |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua          |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về   |

### **Request Example**

```http
GET /api/schedules/content/1?stage=knockout&skip=0&limit=20
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": 1,
        "contentId": 1,
        "roundNumber": null,
        "groupName": null,
        "stage": "knockout",
        "knockoutRound": "Final",
        "tableNumber": 1,
        "scheduledAt": "2026-02-15T08:00:00.000Z",
        "createdAt": "2026-01-20T10:00:00.000Z",
        "updatedAt": "2026-01-20T10:00:00.000Z",
        "matches": [
          {
            "id": 1,
            "scheduleId": 1,
            "entryAId": 5,
            "entryBId": 8,
            "status": "scheduled",
            "winnerEntryId": null
          }
        ]
      }
    ],
    "count": 10,
    "skip": 0,
    "limit": 20
  }
}
```

### **Error Responses**

**400 Bad Request**

```json
{
  "success": false,
  "message": "Invalid stage value. Must be 'group' or 'knockout'"
}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Xóa một schedule. ⚠️ **Cảnh báo:** Xóa schedule sẽ xóa luôn các matches liên quan (cascade delete).

### **Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Schedule ID |

### **Request Example**

```http
DELETE /api/schedules/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Response - 204 No Content**

Không có response body. Status code 204 nghĩa là xóa thành công.

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Schedule not found"
}
```

---

## **Important Notes cho Frontend**

### **1. Workflow tạo lịch thi đấu**

**Cho giải có vòng bảng:**

```javascript
// Step 1: Tạo tournament và contents
POST /api/tournaments

// Step 2: Entries đăng ký
POST /api/entries/register

// Step 3: Tạo lịch TOÀN BỘ (group + knockout)
POST /api/schedules/generate-complete
{
  "contentId": 1,
  "startDate": "2026-03-15T08:00:00.000Z",
  "endDate": "2026-03-20T18:00:00.000Z"
}

// ✅ Done! Lịch đã được tạo đầy đủ
```

**Cho giải chỉ có knockout:**

```javascript
// Step 1: Tạo tournament và contents (isGroupStage = false)
POST /api/tournaments

// Step 2: Entries đăng ký
POST /api/entries/register

// Step 3: Tạo lịch knockout only
POST /api/schedules/generate-knockout-only
{
  "contentId": 2
}

// ✅ Done! Lịch knockout đã được tạo
```

### **2. Date Format**

- Luôn sử dụng ISO 8601 format: `"2026-03-15T08:00:00.000Z"`
- `startDate` và `endDate` phải là valid dates
- `endDate` phải sau `startDate`

### **3. Automatic Features**

Hệ thống tự động xử lý:

✅ **Phân bổ thời gian:**

- Mỗi trận đấu cách nhau 30 phút
- Nghỉ trưa 12:00-14:00
- Tối đa 2 trận/ngày cho mỗi entry

✅ **Phân bổ bàn thi đấu:**

- Sử dụng `numberOfTables` từ tournament
- Tối ưu hóa để các trận diễn ra song song

✅ **Group Stage:**

- Tự động phân chia entries vào các bảng
- Tạo lịch round-robin (mọi đội gặp nhau)
- Tính toán số bảng tối ưu (4, 8, 16...)
- Mỗi bảng có 3-5 đội

✅ **Knockout Stage:**

- Lấy top 2 mỗi bảng (nếu có vòng bảng)
- Tạo nhánh đấu cân bằng
- Xử lý bye matches tự động
- Sắp xếp vòng đấu theo thứ tự hợp lý

### **4. Error Handling**

```javascript
try {
  const response = await fetch("/api/schedules/generate-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentId: 1,
      startDate: "2026-03-15T08:00:00.000Z",
      endDate: "2026-03-20T18:00:00.000Z",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error:", error.message);
    // Handle error: show notification to user
  }

  const result = await response.json();
  console.log("Schedule created:", result);
} catch (error) {
  console.error("Network error:", error);
}
```

### **5. Best Practices**

- ✅ Chỉ gọi API tạo lịch **1 lần** cho mỗi content
- ✅ Kiểm tra `isGroupStage` trước khi gọi API
- ✅ Hiển thị loading indicator vì API mất 2-5 giây
- ✅ Validate entries đủ điều kiện trước khi tạo lịch
- ❌ Không gọi lại API nếu lịch đã tồn tại (check trước)
- ❌ Không edit lịch sau khi giải đã bắt đầu

---

## **TypeScript Interfaces**

```typescript
// Schedule Model
interface Schedule {
  id: number;
  contentId: number;
  roundNumber?: number;
  groupName?: string;
  stage?: "group" | "knockout";
  knockoutRound?: string;
  tableNumber?: number;
  scheduledAt: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

// Generate Complete Schedule Request
interface GenerateCompleteScheduleRequest {
  contentId: number;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
}

// Generate Knockout Only Request
interface GenerateKnockoutOnlyRequest {
  contentId: number;
}

// Generate Complete Schedule Response
interface GenerateCompleteScheduleResponse {
  success: boolean;
  message: string;
  data: {
    groupStage: {
      totalMatches: number;
      groups: string[];
      schedules: Schedule[];
    };
    knockoutStage: {
      totalMatches: number;
      rounds: string[];
      schedules: Schedule[];
    };
  };
}

// Generate Knockout Only Response
interface GenerateKnockoutOnlyResponse {
  success: boolean;
  message: string;
  data: {
    totalMatches: number;
    totalEntries: number;
    bracketSize: number;
    rounds: string[];
    schedules: Schedule[];
  };
}

// Update Schedule Request
interface UpdateScheduleRequest {
  scheduledAt?: string; // ISO 8601
  tableNumber?: number;
  roundNumber?: number;
  groupName?: string;
  stage?: "group" | "knockout";
  knockoutRound?: string;
}
```

---

## **Common Use Cases**

### **Use Case 1: Tạo lịch cho giải có vòng bảng**

```javascript
const createCompleteSchedule = async (contentId, startDate, endDate) => {
  const response = await fetch("/api/schedules/generate-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentId, startDate, endDate }),
  });

  const result = await response.json();

  if (result.success) {
    console.log("Group stage matches:", result.data.groupStage.totalMatches);
    console.log("Knockout matches:", result.data.knockoutStage.totalMatches);
    console.log(
      "Total schedules:",
      result.data.groupStage.schedules.length +
        result.data.knockoutStage.schedules.length,
    );
  }

  return result;
};
```

### **Use Case 2: Tạo lịch cho giải chỉ knockout**

```javascript
const createKnockoutSchedule = async (contentId) => {
  const response = await fetch("/api/schedules/generate-knockout-only", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentId }),
  });

  const result = await response.json();

  if (result.success) {
    console.log("Total knockout matches:", result.data.totalMatches);
    console.log("Bracket size:", result.data.bracketSize);
    console.log("Rounds:", result.data.rounds);
  }

  return result;
};
```

### **Use Case 3: Hiển thị lịch theo ngày**

```javascript
const getSchedulesByDate = async (date) => {
  const schedules = await fetch("/api/schedules?limit=1000").then((r) =>
    r.json(),
  );

  const targetDate = new Date(date).toDateString();

  return schedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.scheduledAt).toDateString();
    return scheduleDate === targetDate;
  });
};
```

### **Use Case 4: Điều chỉnh thời gian trận đấu**

```javascript
const rescheduleMatch = async (scheduleId, newTime) => {
  const response = await fetch(`/api/schedules/${scheduleId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ scheduledAt: newTime }),
  });

  return await response.json();
};
```
