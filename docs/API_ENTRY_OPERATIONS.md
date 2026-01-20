# 📘 API Documentation - Entry Operations

Tài liệu này mô tả các API để **quản lý entries** (đăng ký tham gia) trong tournaments.

---

## **Table of Contents**

1. [Create Entry](#1-create-entry)
2. [Register Entry (Team Manager)](#2-register-entry-team-manager)
3. [Get All Entries](#3-get-all-entries)
4. [Get Entry by ID](#4-get-entry-by-id)
5. [Get Entries by Content ID](#5-get-entries-by-content-id)
6. [Update Entry](#6-update-entry)
7. [Delete Entry](#7-delete-entry)
8. [Import Single Entries - Preview](#8-import-single-entries---preview)
9. [Import Single Entries - Confirm](#9-import-single-entries---confirm)
10. [Import Double Entries - Preview](#10-import-double-entries---preview)
11. [Import Double Entries - Confirm](#11-import-double-entries---confirm)
12. [Import Team Entries - Preview](#12-import-team-entries---preview)
13. [Import Team Entries - Confirm](#13-import-team-entries---confirm)

---

## **1. Create Entry**

### **Endpoint**

```
POST /api/entries
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication trong production)

### **Description**

Tạo một entry mới cho tournament content.

### **Request Body**

#### **TypeScript Interface**

```typescript
interface CreateEntryDto {
  contentId: number; // Required - ID của tournament content
  teamId: number; // Required - ID của team đăng ký
}
```

#### **Field Descriptions**

| Field       | Type    | Required | Description                           |
| ----------- | ------- | -------- | ------------------------------------- |
| `contentId` | integer | ✅ Yes   | ID của tournament content cần đăng ký |
| `teamId`    | integer | ✅ Yes   | ID của team tham gia                  |

### **Request Example**

```json
{
  "contentId": 1,
  "teamId": 5
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "contentId": 1,
  "teamId": 5,
  "createdAt": "2026-01-18T10:00:00.000Z",
  "updatedAt": "2026-01-18T10:00:00.000Z"
}
```

### **Error Responses**

#### **400 Bad Request**

```json
{
  "message": "Error creating entry",
  "error": {}
}
```

---

## **2. Register Entry (Team Manager)**

### **Endpoint**

```
POST /api/entries/register
```

### **Authentication**

✅ **Required** - Bearer token (Team manager only)

### **Description**

Team manager đăng ký team của mình tham gia tournament content với danh sách thành viên được chọn. API này thực hiện validation về:

- Người đăng ký phải là team_manager
- Số lượng members phù hợp với loại content (single/double/team)
- Giới tính members phù hợp với yêu cầu content
- ELO của members được lưu tại thời điểm đăng ký

### **Request Body**

#### **TypeScript Interface**

```typescript
interface RegisterEntryDto {
  contentId: number; // Required - ID của tournament content
  teamId: number; // Required - ID của team
  memberIds: number[]; // Required - Array user IDs tham gia entry này
}
```

#### **Field Descriptions**

| Field       | Type      | Required | Description                                 |
| ----------- | --------- | -------- | ------------------------------------------- |
| `contentId` | integer   | ✅ Yes   | ID của tournament content                   |
| `teamId`    | integer   | ✅ Yes   | ID của team (user phải là team_manager)     |
| `memberIds` | integer[] | ✅ Yes   | Array user IDs (members) tham gia entry này |

### **Validation Rules**

| Content Type | Required Members | Notes             |
| ------------ | ---------------- | ----------------- |
| `single`     | 1 member         | 1 người chơi đơn  |
| `double`     | 2 members        | 2 người chơi đôi  |
| `team`       | 3-5 members      | Team từ 3-5 người |

### **Request Examples**

#### **Example 1: Register for Singles Content**

```json
{
  "contentId": 1,
  "teamId": 5,
  "memberIds": [10]
}
```

#### **Example 2: Register for Doubles Content**

```json
{
  "contentId": 2,
  "teamId": 5,
  "memberIds": [10, 15]
}
```

#### **Example 3: Register for Team Content**

```json
{
  "contentId": 3,
  "teamId": 5,
  "memberIds": [10, 15, 20, 25]
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "contentId": 1,
  "teamId": 5,
  "createdAt": "2026-01-18T10:00:00.000Z",
  "updatedAt": "2026-01-18T10:00:00.000Z",
  "members": [
    {
      "id": 1,
      "entryId": 1,
      "userId": 10,
      "eloAtEntry": 1650,
      "createdAt": "2026-01-18T10:00:00.000Z",
      "updatedAt": "2026-01-18T10:00:00.000Z"
    }
  ],
  "team": {
    "id": 5,
    "name": "Team Alpha",
    "tournamentId": 1
  },
  "content": {
    "id": 1,
    "name": "Men's Singles",
    "type": "single"
  }
}
```

### **Error Responses**

#### **401 Unauthorized** - Not authenticated

```json
{
  "message": "Unauthorized - User not authenticated"
}
```

#### **400 Bad Request** - Not team manager

```json
{
  "message": "Only team manager can register entry for the team",
  "error": {}
}
```

#### **400 Bad Request** - Invalid number of members

```json
{
  "message": "Single content requires exactly 1 member",
  "error": {}
}
```

#### **400 Bad Request** - Gender mismatch

```json
{
  "message": "Members must be male for this content",
  "error": {}
}
```

#### **400 Bad Request** - Team already registered

```json
{
  "message": "Team has already registered for this content",
  "error": {}
}
```

---

## **3. Get All Entries**

### **Endpoint**

```
GET /api/entries
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tất cả entries với pagination.

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/entries?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "contentId": 1,
    "teamId": 5,
    "createdAt": "2026-01-18T10:00:00.000Z",
    "updatedAt": "2026-01-18T10:00:00.000Z"
  },
  {
    "id": 2,
    "contentId": 1,
    "teamId": 8,
    "createdAt": "2026-01-18T11:00:00.000Z",
    "updatedAt": "2026-01-18T11:00:00.000Z"
  }
]
```

### **Error Responses**

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching entries",
  "error": {}
}
```

---

## **4. Get Entry by ID**

### **Endpoint**

```
GET /api/entries/{id}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin chi tiết của một entry theo ID.

### **Path Parameters**

| Parameter | Type    | Required | Description          |
| --------- | ------- | -------- | -------------------- |
| `id`      | integer | ✅ Yes   | ID của entry cần lấy |

### **Request Example**

```http
GET /api/entries/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "contentId": 1,
  "teamId": 5,
  "createdAt": "2026-01-18T10:00:00.000Z",
  "updatedAt": "2026-01-18T10:00:00.000Z"
}
```

### **Error Responses**

#### **404 Not Found**

```json
{
  "message": "Entry not found"
}
```

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching entry",
  "error": {}
}
```

---

## **5. Get Entries by Content ID**

### **Endpoint**

```
GET /api/entries/content/{contentId}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy tất cả entries đã đăng ký cho một tournament content cụ thể.

### **Path Parameters**

| Parameter   | Type    | Required | Description                       |
| ----------- | ------- | -------- | --------------------------------- |
| `contentId` | integer | ✅ Yes   | ID của tournament content cần lấy |

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/entries/content/1?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "contentId": 1,
    "teamId": 5,
    "createdAt": "2026-01-18T10:00:00.000Z",
    "updatedAt": "2026-01-18T10:00:00.000Z"
  },
  {
    "id": 2,
    "contentId": 1,
    "teamId": 8,
    "createdAt": "2026-01-18T11:00:00.000Z",
    "updatedAt": "2026-01-18T11:00:00.000Z"
  }
]
```

### **Error Responses**

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching entries",
  "error": {}
}
```

---

## **6. Update Entry**

### **Endpoint**

```
PUT /api/entries/{id}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication trong production)

### **Description**

Cập nhật thông tin entry, chủ yếu để thay đổi danh sách members.

### **Path Parameters**

| Parameter | Type    | Required | Description             |
| --------- | ------- | -------- | ----------------------- |
| `id`      | integer | ✅ Yes   | ID của entry cần update |

### **Request Body**

#### **TypeScript Interface**

```typescript
interface UpdateEntryDto {
  memberIds?: number[]; // Optional - Array user IDs mới
}
```

#### **Field Descriptions**

| Field       | Type      | Required | Description                    |
| ----------- | --------- | -------- | ------------------------------ |
| `memberIds` | integer[] | ❌ No    | Array user IDs mới thay thế cũ |

### **Request Example**

```json
{
  "memberIds": [10, 15, 20]
}
```

### **Response - 200 OK**

```json
[
  1,
  [
    {
      "id": 1,
      "contentId": 1,
      "teamId": 5,
      "createdAt": "2026-01-18T10:00:00.000Z",
      "updatedAt": "2026-01-18T12:00:00.000Z"
    }
  ]
]
```

### **Error Responses**

#### **404 Not Found**

```json
{
  "message": "Entry not found"
}
```

#### **400 Bad Request**

```json
{
  "message": "Error updating entry",
  "error": {}
}
```

---

## **7. Delete Entry**

### **Endpoint**

```
DELETE /api/entries/{id}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication trong production)

### **Description**

Xóa một entry khỏi tournament. Cascade xóa tất cả entry members liên quan.

### **Path Parameters**

| Parameter | Type    | Required | Description          |
| --------- | ------- | -------- | -------------------- |
| `id`      | integer | ✅ Yes   | ID của entry cần xóa |

### **Request Example**

```http
DELETE /api/entries/1
```

### **Response - 204 No Content**

Không có response body. HTTP status 204 nghĩa là đã xóa thành công.

### **Error Responses**

#### **404 Not Found**

```json
{
  "message": "Entry not found"
}
```

#### **500 Internal Server Error**

```json
{
  "message": "Error deleting entry",
  "error": {}
}
```

---

## **8. Import Single Entries - Preview**

### **Endpoint**

```
POST /api/entries/import/preview
```

### **Authentication**

✅ **Required** - Bearer token

### **Description**

Upload và preview Excel file chứa danh sách single entries (1 người chơi) trước khi import chính thức vào database. API sẽ validate dữ liệu và trả về các lỗi nếu có.

### **Request Body (Multipart Form Data)**

| Field       | Type    | Required | Description                                       |
| ----------- | ------- | -------- | ------------------------------------------------- |
| `file`      | file    | ✅ Yes   | Excel file (.xlsx or .xls) chứa danh sách entries |
| `contentId` | integer | ✅ Yes   | ID của tournament content (phải là type 'single') |

### **Excel File Format**

Excel file cần có các cột sau:

| Column | Description      | Required | Example          |
| ------ | ---------------- | -------- | ---------------- |
| STT    | Số thứ tự        | ✅ Yes   | 1, 2, 3...       |
| Name   | Tên người chơi   | ✅ Yes   | John Doe         |
| Email  | Email người chơi | ✅ Yes   | john@example.com |

### **Request Example (cURL)**

```bash
curl -X POST http://localhost:3000/api/entries/import/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@entries.xlsx" \
  -F "contentId=1"
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "entries": [
      {
        "name": "John Doe",
        "userId": 1,
        "email": "john@example.com",
        "rowNumber": 2
      },
      {
        "name": "Jane Smith",
        "userId": 2,
        "email": "jane@example.com",
        "rowNumber": 3
      }
    ],
    "errors": [],
    "summary": {
      "totalEntries": 10,
      "entriesWithErrors": 0,
      "contentType": "single",
      "maxEntries": 32,
      "currentEntries": 5,
      "availableSlots": 27
    }
  }
}
```

### **Response - 200 OK (With Errors)**

```json
{
  "success": true,
  "data": {
    "valid": false,
    "entries": [
      {
        "name": "John Doe",
        "userId": 1,
        "email": "john@example.com",
        "rowNumber": 2
      }
    ],
    "errors": [
      {
        "rowNumber": 5,
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      },
      {
        "rowNumber": 7,
        "field": "name",
        "message": "User not found",
        "value": "Unknown User"
      }
    ],
    "summary": {
      "totalEntries": 10,
      "entriesWithErrors": 2,
      "contentType": "single",
      "maxEntries": 32,
      "currentEntries": 5,
      "availableSlots": 27
    }
  }
}
```

### **Error Responses**

#### **400 Bad Request** - Invalid file

```json
{
  "message": "Invalid file format",
  "error": {}
}
```

#### **401 Unauthorized**

```json
{
  "message": "Unauthorized"
}
```

---

## **9. Import Single Entries - Confirm**

### **Endpoint**

```
POST /api/entries/import/confirm
```

### **Authentication**

✅ **Required** - Bearer token

### **Description**

Confirm và lưu danh sách entries đã được preview thành công vào database.

### **Request Body**

#### **TypeScript Interface**

```typescript
interface ImportSingleEntryDto {
  name: string;
  userId: number;
  email: string;
  rowNumber: number;
}

interface ConfirmSingleEntriesDto {
  contentId: number;
  entries: ImportSingleEntryDto[];
}
```

### **Request Example**

```json
{
  "contentId": 1,
  "entries": [
    {
      "name": "John Doe",
      "userId": 1,
      "email": "john@example.com",
      "rowNumber": 2
    },
    {
      "name": "Jane Smith",
      "userId": 2,
      "email": "jane@example.com",
      "rowNumber": 3
    }
  ]
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Entries imported successfully",
  "data": {
    "success": true,
    "createdEntries": 10,
    "entryIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
}
```

### **Error Responses**

#### **400 Bad Request**

```json
{
  "message": "Invalid data or import failed",
  "error": {}
}
```

#### **401 Unauthorized**

```json
{
  "message": "Unauthorized"
}
```

---

## **10. Import Double Entries - Preview**

### **Endpoint**

```
POST /api/entries/import/double/preview
```

### **Authentication**

✅ **Required** - Bearer token

### **Description**

Upload và preview Excel file chứa danh sách double entries (2 người chơi) trước khi import.

### **Request Body (Multipart Form Data)**

| Field       | Type    | Required | Description                                       |
| ----------- | ------- | -------- | ------------------------------------------------- |
| `file`      | file    | ✅ Yes   | Excel file (.xlsx or .xls) chứa danh sách doubles |
| `contentId` | integer | ✅ Yes   | ID của tournament content (phải là type 'double') |

### **Excel File Format**

Excel file cần có 5 cột:

| Column        | Description        | Required | Example          |
| ------------- | ------------------ | -------- | ---------------- |
| STT           | Số thứ tự          | ✅ Yes   | 1, 2, 3...       |
| Player1 Name  | Tên người chơi 1   | ✅ Yes   | John Doe         |
| Player1 Email | Email người chơi 1 | ✅ Yes   | john@example.com |
| Player2 Name  | Tên người chơi 2   | ✅ Yes   | Jane Smith       |
| Player2 Email | Email người chơi 2 | ✅ Yes   | jane@example.com |

### **Request Example (cURL)**

```bash
curl -X POST http://localhost:3000/api/entries/import/double/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@doubles.xlsx" \
  -F "contentId=2"
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "entries": [
      {
        "player1Name": "John Doe",
        "player1UserId": 1,
        "player1Email": "john@example.com",
        "player1TeamId": 1,
        "player2Name": "Jane Smith",
        "player2UserId": 2,
        "player2Email": "jane@example.com",
        "player2TeamId": 1,
        "rowNumber": 2
      }
    ],
    "errors": [],
    "summary": {
      "totalEntries": 8,
      "entriesWithErrors": 0,
      "contentType": "double",
      "maxEntries": 16,
      "currentEntries": 4,
      "availableSlots": 12
    }
  }
}
```

### **Error Responses**

#### **400 Bad Request**

```json
{
  "message": "Invalid file or validation errors",
  "error": {}
}
```

---

## **11. Import Double Entries - Confirm**

### **Endpoint**

```
POST /api/entries/import/double/confirm
```

### **Authentication**

✅ **Required** - Bearer token

### **Description**

Confirm và lưu danh sách double entries vào database.

### **Request Body**

#### **TypeScript Interface**

```typescript
interface ImportDoubleEntryDto {
  player1Name: string;
  player1UserId: number;
  player1Email: string;
  player1TeamId?: number | null;
  player2Name: string;
  player2UserId: number;
  player2Email: string;
  player2TeamId?: number | null;
  rowNumber: number;
}

interface ConfirmDoubleEntriesDto {
  contentId: number;
  entries: ImportDoubleEntryDto[];
}
```

### **Request Example**

```json
{
  "contentId": 2,
  "entries": [
    {
      "player1Name": "John Doe",
      "player1UserId": 1,
      "player1Email": "john@example.com",
      "player1TeamId": 1,
      "player2Name": "Jane Smith",
      "player2UserId": 2,
      "player2Email": "jane@example.com",
      "player2TeamId": 1,
      "rowNumber": 2
    }
  ]
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Double entries imported successfully",
  "data": {
    "success": true,
    "createdEntries": 8,
    "entryIds": [1, 2, 3, 4, 5, 6, 7, 8]
  }
}
```

### **Error Responses**

#### **400 Bad Request**

```json
{
  "message": "Invalid data or import failed",
  "error": {}
}
```

---

## **12. Import Team Entries - Preview**

### **Endpoint**

```
POST /api/entries/import/team/preview
```

### **Authentication**

✅ **Required** - Bearer token

### **Description**

Upload và preview Excel file chứa danh sách team entries (3-5 người chơi) trước khi import.

### **Request Body (Multipart Form Data)**

| Field       | Type    | Required | Description                                     |
| ----------- | ------- | -------- | ----------------------------------------------- |
| `file`      | file    | ✅ Yes   | Excel file (.xlsx or .xls) chứa team entries    |
| `contentId` | integer | ✅ Yes   | ID của tournament content (phải là type 'team') |

### **Excel File Format**

Excel file có thể có 3-5 cột (tùy vào số lượng players):

| Column        | Description        | Required | Example             |
| ------------- | ------------------ | -------- | ------------------- |
| STT           | Số thứ tự          | ✅ Yes   | 1, 2, 3...          |
| Player1 Name  | Tên người chơi 1   | ✅ Yes   | John Doe            |
| Player1 Email | Email người chơi 1 | ✅ Yes   | john@example.com    |
| Player2 Name  | Tên người chơi 2   | ✅ Yes   | Jane Smith          |
| Player2 Email | Email người chơi 2 | ✅ Yes   | jane@example.com    |
| Player3 Name  | Tên người chơi 3   | ✅ Yes   | Bob Wilson          |
| Player3 Email | Email người chơi 3 | ✅ Yes   | bob@example.com     |
| Player4 Name  | Tên người chơi 4   | ❌ No    | Alice Brown         |
| Player4 Email | Email người chơi 4 | ❌ No    | alice@example.com   |
| Player5 Name  | Tên người chơi 5   | ❌ No    | Charlie Davis       |
| Player5 Email | Email người chơi 5 | ❌ No    | charlie@example.com |

> 💡 **Lưu ý:** Team entries phải có từ 3-5 players

### **Request Example (cURL)**

```bash
curl -X POST http://localhost:3000/api/entries/import/team/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@teams.xlsx" \
  -F "contentId=3"
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "entries": [
      {
        "players": [
          {
            "name": "John Doe",
            "userId": 1,
            "email": "john@example.com"
          },
          {
            "name": "Jane Smith",
            "userId": 2,
            "email": "jane@example.com"
          },
          {
            "name": "Bob Wilson",
            "userId": 3,
            "email": "bob@example.com"
          }
        ],
        "teamId": 1,
        "rowNumber": 2
      }
    ],
    "errors": [],
    "summary": {
      "totalEntries": 5,
      "entriesWithErrors": 0,
      "contentType": "team",
      "maxEntries": 8,
      "currentEntries": 2,
      "availableSlots": 6
    }
  }
}
```

### **Error Responses**

#### **400 Bad Request**

```json
{
  "message": "Invalid file format or validation errors",
  "error": {}
}
```

---

## **13. Import Team Entries - Confirm**

### **Endpoint**

```
POST /api/entries/import/team/confirm
```

### **Authentication**

✅ **Required** - Bearer token

### **Description**

Confirm và lưu danh sách team entries (3-5 players per entry) vào database.

### **Request Body**

#### **TypeScript Interface**

```typescript
interface ImportTeamPlayerDto {
  name: string;
  userId: number;
  email: string;
}

interface ImportTeamEntryDto {
  players: ImportTeamPlayerDto[]; // 3-5 players
  teamId: number;
  rowNumber: number;
}

interface ConfirmTeamEntriesDto {
  contentId: number;
  entries: ImportTeamEntryDto[];
}
```

### **Request Example**

```json
{
  "contentId": 3,
  "entries": [
    {
      "players": [
        {
          "name": "John Doe",
          "userId": 1,
          "email": "john@example.com"
        },
        {
          "name": "Jane Smith",
          "userId": 2,
          "email": "jane@example.com"
        },
        {
          "name": "Bob Wilson",
          "userId": 3,
          "email": "bob@example.com"
        }
      ],
      "teamId": 1,
      "rowNumber": 2
    }
  ]
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Team entries imported successfully",
  "data": {
    "success": true,
    "createdEntries": 5,
    "entryIds": [1, 2, 3, 4, 5]
  }
}
```

### **Error Responses**

#### **400 Bad Request**

```json
{
  "message": "Invalid data or import failed",
  "error": {}
}
```

---

## **TypeScript Interfaces Summary**

### **Entry Model**

```typescript
interface Entry {
  id: number;
  contentId: number;
  teamId: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  content?: TournamentContent;
  team?: Team;
  members?: EntryMember[];
}
```

### **Entry Member Model**

```typescript
interface EntryMember {
  id: number;
  entryId: number;
  userId: number;
  eloAtEntry: number; // ELO score tại thời điểm đăng ký
  createdAt: Date;
  updatedAt: Date;
}
```

### **DTOs**

```typescript
// Create Entry
interface CreateEntryDto {
  contentId: number;
  teamId: number;
}

// Register Entry (Team Manager)
interface RegisterEntryDto {
  contentId: number;
  teamId: number;
  memberIds: number[];
}

// Update Entry
interface UpdateEntryDto {
  memberIds?: number[];
}

// Response
interface EntryResponseDto {
  id: number;
  contentId: number;
  teamId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## **Common Use Cases**

### **Use Case 1: Team Manager registers team for singles**

```typescript
const response = await fetch("/api/entries/register", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    contentId: 1, // Men's Singles
    teamId: 5, // My team
    memberIds: [10], // 1 player for singles
  }),
});

if (response.status === 201) {
  const entry = await response.json();
  console.log("Registered successfully:", entry);
}
```

### **Use Case 2: Get all entries for a tournament content**

```typescript
const contentId = 1;
const response = await fetch(
  `/api/entries/content/${contentId}?skip=0&limit=50`,
);
const entries = await response.json();

console.log(`Total entries: ${entries.length}`);
entries.forEach((entry) => {
  console.log(`Team ${entry.teamId} registered`);
});
```

### **Use Case 3: Check if team already registered**

```typescript
async function isTeamRegistered(
  contentId: number,
  teamId: number,
): Promise<boolean> {
  const response = await fetch(`/api/entries/content/${contentId}`);
  const entries = await response.json();

  return entries.some((entry: any) => entry.teamId === teamId);
}

// Usage
if (await isTeamRegistered(1, 5)) {
  alert("Your team is already registered for this content");
}
```

---

## **Business Rules & Validation**

### **1. Team Manager Authorization**

Chỉ user có role `team_manager` trong team mới được đăng ký entry:

```typescript
// Backend validation
const teamMember = await TeamMember.findOne({
  where: { teamId, userId },
});

if (!teamMember || teamMember.role !== "team_manager") {
  throw new Error("Only team manager can register entry");
}
```

### **2. Member Count Validation**

| Content Type | Members Required | Validation                    |
| ------------ | ---------------- | ----------------------------- |
| `single`     | Exactly 1        | memberIds.length === 1        |
| `double`     | Exactly 2        | memberIds.length === 2        |
| `team`       | 3-5 members      | memberIds.length >= 3 && <= 5 |

### **3. Gender Validation**

Nếu content có yêu cầu giới tính:

```typescript
// Example: Men's Singles (gender = 'male')
if (content.gender === "male") {
  // All members must be male
  const users = await User.findAll({ where: { id: memberIds } });
  const invalidUsers = users.filter((u) => u.gender !== "male");

  if (invalidUsers.length > 0) {
    throw new Error("All members must be male for this content");
  }
}
```

### **4. Duplicate Registration Prevention**

Một team chỉ được đăng ký 1 lần cho mỗi content:

```typescript
const existing = await Entry.findOne({
  where: { contentId, teamId },
});

if (existing) {
  throw new Error("Team already registered for this content");
}
```

### **5. ELO Snapshot**

ELO của mỗi member được lưu tại thời điểm đăng ký:

```typescript
// Automatically captured during registration
{
  entryId: 1,
  userId: 10,
  eloAtEntry: 1650  // Current ELO score
}
```

### **Use Case 4: Bulk import single entries from Excel**

```typescript
async function importSingleEntries(
  contentId: number,
  file: File,
  token: string,
) {
  // Step 1: Preview import
  const formData = new FormData();
  formData.append("file", file);
  formData.append("contentId", contentId.toString());

  const previewResponse = await fetch("/api/entries/import/preview", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const previewData = await previewResponse.json();

  // Step 2: Check for errors
  if (!previewData.data.valid) {
    console.error("Validation errors:", previewData.data.errors);
    return { success: false, errors: previewData.data.errors };
  }

  // Step 3: Confirm import
  const confirmResponse = await fetch("/api/entries/import/confirm", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentId,
      entries: previewData.data.entries,
    }),
  });

  const confirmData = await confirmResponse.json();
  return { success: true, data: confirmData };
}
```

### **Use Case 5: Import double entries with validation**

```typescript
async function importDoubleEntries(
  contentId: number,
  file: File,
  token: string,
) {
  try {
    // Step 1: Upload and preview
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contentId", contentId.toString());

    const previewResponse = await fetch("/api/entries/import/double/preview", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const preview = await previewResponse.json();

    // Step 2: Show validation summary to user
    console.log(`Total entries: ${preview.data.summary.totalEntries}`);
    console.log(`Errors: ${preview.data.summary.entriesWithErrors}`);
    console.log(`Available slots: ${preview.data.summary.availableSlots}`);

    if (preview.data.errors.length > 0) {
      // Show errors to user for correction
      return { success: false, errors: preview.data.errors };
    }

    // Step 3: User confirms, proceed with import
    const confirmResponse = await fetch("/api/entries/import/double/confirm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentId,
        entries: preview.data.entries,
      }),
    });

    return await confirmResponse.json();
  } catch (error) {
    console.error("Import failed:", error);
    throw error;
  }
}
```

### **Use Case 6: Import team entries (3-5 players)**

```typescript
async function importTeamEntries(contentId: number, file: File, token: string) {
  // Step 1: Preview
  const formData = new FormData();
  formData.append("file", file);
  formData.append("contentId", contentId.toString());

  const previewResponse = await fetch("/api/entries/import/team/preview", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const preview = await previewResponse.json();

  // Step 2: Validate team size (3-5 players)
  const invalidTeams = preview.data.entries.filter(
    (entry: any) => entry.players.length < 3 || entry.players.length > 5,
  );

  if (invalidTeams.length > 0) {
    console.error("Some teams have invalid number of players");
    return { success: false, message: "Teams must have 3-5 players" };
  }

  // Step 3: Confirm import
  if (preview.data.valid) {
    const confirmResponse = await fetch("/api/entries/import/team/confirm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentId,
        entries: preview.data.entries,
      }),
    });

    return await confirmResponse.json();
  }
}
```

---

## **Frontend Implementation Example (React)**

```typescript
import { useState, useEffect } from 'react';

interface Entry {
  id: number;
  contentId: number;
  teamId: number;
  createdAt: string;
  updatedAt: string;
}

function EntryRegistration() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  // Register entry
  const registerEntry = async (
    contentId: number,
    teamId: number,
    memberIds: number[],
    token: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/entries/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contentId, teamId, memberIds })
      });

      if (response.status === 201) {
        const entry = await response.json();
        console.log('Registration successful:', entry);
        return entry;
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get entries for content
  const getEntriesByContent = async (contentId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/entries/content/${contentId}`);
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Entry Registration</h1>
      {loading && <p>Loading...</p>}
      {/* Your UI here */}
    </div>
  );
}
```

---

## **HTTP Status Codes Summary**

| Status Code | Meaning        | When Used                             |
| ----------- | -------------- | ------------------------------------- |
| 200         | OK             | GET, PUT successful                   |
| 201         | Created        | POST successful                       |
| 204         | No Content     | DELETE successful                     |
| 400         | Bad Request    | Invalid input, validation errors      |
| 401         | Unauthorized   | Not authenticated or not team manager |
| 404         | Not Found      | Entry không tồn tại                   |
| 500         | Internal Error | Server error, database error          |

---

## **Related Models**

Entries có relationship với:

- **TournamentContent**: Many-to-One
- **Team**: Many-to-One
- **EntryMember**: One-to-Many
- **Match**: One-to-Many (as entryA, entryB, or winner)

```typescript
// Entry với Content
entry.content → TournamentContent

// Entry với Team
entry.team → Team

// Entry với Members
entry.members → EntryMember[]

// Entry với Matches
entry.matchesAsA → Match[] (khi entry là đội A)
entry.matchesAsB → Match[] (khi entry là đội B)
entry.wonMatches → Match[] (khi entry thắng)
```

---

**Last Updated**: January 18, 2026  
**API Version**: 1.0.0
