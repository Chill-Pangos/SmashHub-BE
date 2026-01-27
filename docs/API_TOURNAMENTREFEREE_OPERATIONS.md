# 📘 API Documentation - Tournament Referee Operations

Tài liệu này mô tả các API để **quản lý trọng tài trong giải đấu (Tournament Referees)**.

> 📝 **Lưu ý quan trọng:**
>
> - Tournament Referee khác với **Match Umpire** (trọng tài điều khiển trận đấu)
> - Tournament Referee là danh sách trọng tài **đăng ký tham gia giải đấu**
> - Có 2 roles: **main** (trọng tài chính) và **assistant** (trợ lý trọng tài)
> - Hỗ trợ tracking **availability** (tình trạng sẵn sàng)

---

## **Referee Roles**

| Role        | Description                                           |
| ----------- | ----------------------------------------------------- |
| `main`      | Trọng tài chính - điều khiển trận đấu                 |
| `assistant` | Trợ lý trọng tài - hỗ trợ trọng tài chính             |

---

## **Table of Contents**

1. [Create Tournament Referee](#1-create-tournament-referee)
2. [Assign Multiple Referees](#2-assign-multiple-referees)
3. [Get All Tournament Referees](#3-get-all-tournament-referees)
4. [Get Referees by Tournament ID](#4-get-referees-by-tournament-id)
5. [Get Available Referees](#5-get-available-referees)
6. [Get Tournament Referee by ID](#6-get-tournament-referee-by-id)
7. [Update Tournament Referee](#7-update-tournament-referee)
8. [Update Referee Availability](#8-update-referee-availability)
9. [Delete Tournament Referee](#9-delete-tournament-referee)

---

## **1. Create Tournament Referee**

### **Endpoint**

```
POST /api/tournament-referees
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Thêm một trọng tài vào giải đấu.

### **Request Body**

| Field          | Type    | Required | Description                          |
| -------------- | ------- | -------- | ------------------------------------ |
| `tournamentId` | integer | Yes      | ID của tournament                    |
| `refereeId`    | integer | Yes      | User ID của trọng tài                |
| `role`         | string  | Yes      | Role: `main` hoặc `assistant`        |

### **Request Example**

```json
{
  "tournamentId": 1,
  "refereeId": 15,
  "role": "main"
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Tournament referee created successfully",
  "data": {
    "id": 1,
    "tournamentId": 1,
    "refereeId": 15,
    "role": "main",
    "isAvailable": true,
    "createdAt": "2024-06-15T10:00:00.000Z",
    "updatedAt": "2024-06-15T10:00:00.000Z",
    "referee": {
      "id": 15,
      "username": "referee_nguyen",
      "fullName": "Nguyễn Văn A"
    }
  }
}
```

### **Error Responses**

**400 Bad Request - Referee already assigned**

```json
{
  "message": "Referee is already assigned to this tournament"
}
```

**404 Not Found - Tournament or Referee not found**

```json
{
  "message": "Tournament not found"
}
```

---

## **2. Assign Multiple Referees**

### **Endpoint**

```
POST /api/tournament-referees/assign
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Phân công nhiều trọng tài vào giải đấu cùng lúc. Tất cả được assign với role mặc định là `assistant`.

### **Request Body**

| Field          | Type      | Required | Description                    |
| -------------- | --------- | -------- | ------------------------------ |
| `tournamentId` | integer   | Yes      | ID của tournament              |
| `refereeIds`   | integer[] | Yes      | Array các user IDs của trọng tài |

### **Request Example**

```json
{
  "tournamentId": 1,
  "refereeIds": [15, 16, 17, 18, 19]
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "5 referees assigned successfully",
  "data": {
    "tournamentId": 1,
    "assignedCount": 5,
    "referees": [
      {
        "id": 1,
        "refereeId": 15,
        "role": "assistant",
        "isAvailable": true
      },
      {
        "id": 2,
        "refereeId": 16,
        "role": "assistant",
        "isAvailable": true
      }
    ]
  }
}
```

### **Error Responses**

**400 Bad Request - Some referees already assigned**

```json
{
  "message": "Some referees are already assigned to this tournament",
  "existingRefereeIds": [15, 16]
}
```

---

## **3. Get All Tournament Referees**

### **Endpoint**

```
GET /api/tournament-referees
```

### **Authentication**

❌ **Not Required** (Public API)

### **Description**

Lấy tất cả tournament referees với optional filter theo tournament.

### **Query Parameters**

| Parameter      | Type    | Default | Description                |
| -------------- | ------- | ------- | -------------------------- |
| `tournamentId` | integer | -       | Filter theo tournament ID  |
| `skip`         | integer | 0       | Số records bỏ qua          |
| `limit`        | integer | 10      | Số records tối đa trả về   |

### **Request Example**

```http
GET /api/tournament-referees?tournamentId=1&skip=0&limit=20
```

### **Response - 200 OK**

```json
{
  "data": [
    {
      "id": 1,
      "tournamentId": 1,
      "refereeId": 15,
      "role": "main",
      "isAvailable": true,
      "createdAt": "2024-06-15T10:00:00.000Z",
      "referee": {
        "id": 15,
        "username": "referee_nguyen",
        "fullName": "Nguyễn Văn A"
      },
      "tournament": {
        "id": 1,
        "name": "Giải vô địch cầu lông toàn quốc 2024"
      }
    }
  ],
  "total": 15,
  "skip": 0,
  "limit": 20
}
```

---

## **4. Get Referees by Tournament ID**

### **Endpoint**

```
GET /api/tournament-referees/tournament/{tournamentId}
```

### **Authentication**

❌ **Not Required** (Public API)

### **Description**

Lấy tất cả trọng tài của một giải đấu cụ thể.

### **Path Parameters**

| Parameter      | Type    | Required | Description     |
| -------------- | ------- | -------- | --------------- |
| `tournamentId` | integer | Yes      | Tournament ID   |

### **Query Parameters**

| Parameter | Type    | Default | Description              |
| --------- | ------- | ------- | ------------------------ |
| `skip`    | integer | 0       | Số records bỏ qua        |
| `limit`   | integer | 10      | Số records tối đa trả về |

### **Response - 200 OK**

```json
{
  "data": [
    {
      "id": 1,
      "refereeId": 15,
      "role": "main",
      "isAvailable": true,
      "referee": {
        "id": 15,
        "username": "referee_nguyen",
        "fullName": "Nguyễn Văn A",
        "email": "nguyen@example.com"
      }
    },
    {
      "id": 2,
      "refereeId": 16,
      "role": "assistant",
      "isAvailable": false,
      "referee": {
        "id": 16,
        "username": "referee_tran",
        "fullName": "Trần Văn B",
        "email": "tran@example.com"
      }
    }
  ],
  "total": 5
}
```

---

## **5. Get Available Referees**

### **Endpoint**

```
GET /api/tournament-referees/tournament/{tournamentId}/available
```

### **Authentication**

❌ **Not Required** (Public API)

### **Description**

Lấy danh sách các trọng tài **sẵn sàng** (`isAvailable = true`) của một giải đấu. Có thể exclude một số referees.

**Use cases:**
- Dropdown chọn trọng tài khi assign vào match
- Hiển thị trọng tài có thể phân công

### **Path Parameters**

| Parameter      | Type    | Required | Description     |
| -------------- | ------- | -------- | --------------- |
| `tournamentId` | integer | Yes      | Tournament ID   |

### **Query Parameters**

| Parameter    | Type   | Description                              |
| ------------ | ------ | ---------------------------------------- |
| `excludeIds` | string | Comma-separated referee IDs to exclude   |

### **Request Example**

```http
GET /api/tournament-referees/tournament/1/available?excludeIds=15,16
```

### **Response - 200 OK**

```json
{
  "data": [
    {
      "id": 3,
      "refereeId": 17,
      "role": "assistant",
      "isAvailable": true,
      "referee": {
        "id": 17,
        "username": "referee_le",
        "fullName": "Lê Văn C"
      }
    },
    {
      "id": 4,
      "refereeId": 18,
      "role": "main",
      "isAvailable": true,
      "referee": {
        "id": 18,
        "username": "referee_pham",
        "fullName": "Phạm Văn D"
      }
    }
  ],
  "availableCount": 2
}
```

---

## **6. Get Tournament Referee by ID**

### **Endpoint**

```
GET /api/tournament-referees/{id}
```

### **Authentication**

❌ **Not Required** (Public API)

### **Description**

Lấy thông tin chi tiết của một tournament referee.

### **Path Parameters**

| Parameter | Type    | Required | Description             |
| --------- | ------- | -------- | ----------------------- |
| `id`      | integer | Yes      | Tournament Referee ID   |

### **Response - 200 OK**

```json
{
  "id": 1,
  "tournamentId": 1,
  "refereeId": 15,
  "role": "main",
  "isAvailable": true,
  "createdAt": "2024-06-15T10:00:00.000Z",
  "updatedAt": "2024-06-15T10:00:00.000Z",
  "referee": {
    "id": 15,
    "username": "referee_nguyen",
    "fullName": "Nguyễn Văn A",
    "email": "nguyen@example.com"
  },
  "tournament": {
    "id": 1,
    "name": "Giải vô địch cầu lông toàn quốc 2024",
    "startDate": "2024-06-20",
    "endDate": "2024-06-25"
  }
}
```

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Tournament referee not found"
}
```

---

## **7. Update Tournament Referee**

### **Endpoint**

```
PUT /api/tournament-referees/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Cập nhật thông tin tournament referee (role, availability).

### **Path Parameters**

| Parameter | Type    | Required | Description             |
| --------- | ------- | -------- | ----------------------- |
| `id`      | integer | Yes      | Tournament Referee ID   |

### **Request Body**

| Field         | Type    | Required | Description                    |
| ------------- | ------- | -------- | ------------------------------ |
| `role`        | string  | No       | Role: `main` hoặc `assistant`  |
| `isAvailable` | boolean | No       | Trạng thái sẵn sàng            |

### **Request Example**

```json
{
  "role": "main",
  "isAvailable": true
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Tournament referee updated successfully",
  "data": {
    "id": 1,
    "tournamentId": 1,
    "refereeId": 15,
    "role": "main",
    "isAvailable": true,
    "updatedAt": "2024-06-15T11:00:00.000Z"
  }
}
```

---

## **8. Update Referee Availability**

### **Endpoint**

```
PATCH /api/tournament-referees/{id}/availability
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Cập nhật **nhanh** trạng thái sẵn sàng của trọng tài. Dùng khi chỉ cần toggle availability mà không thay đổi role.

**Use cases:**
- Trọng tài báo bận (sick, emergency)
- Trọng tài báo sẵn sàng trở lại
- Toggle nhanh trên UI

### **Path Parameters**

| Parameter | Type    | Required | Description             |
| --------- | ------- | -------- | ----------------------- |
| `id`      | integer | Yes      | Tournament Referee ID   |

### **Request Body**

| Field         | Type    | Required | Description              |
| ------------- | ------- | -------- | ------------------------ |
| `isAvailable` | boolean | Yes      | Trạng thái sẵn sàng mới  |

### **Request Example**

```json
{
  "isAvailable": false
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Availability updated successfully",
  "data": {
    "id": 1,
    "refereeId": 15,
    "isAvailable": false,
    "updatedAt": "2024-06-15T11:30:00.000Z"
  }
}
```

---

## **9. Delete Tournament Referee**

### **Endpoint**

```
DELETE /api/tournament-referees/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Xóa trọng tài khỏi giải đấu.

> ⚠️ **Lưu ý:** Không thể xóa nếu trọng tài đang được assign vào các matches chưa hoàn tất.

### **Path Parameters**

| Parameter | Type    | Required | Description             |
| --------- | ------- | -------- | ----------------------- |
| `id`      | integer | Yes      | Tournament Referee ID   |

### **Response - 204 No Content**

Không có response body. Status code 204 nghĩa là xóa thành công.

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Tournament referee not found"
}
```

**400 Bad Request - Referee is assigned to matches**

```json
{
  "message": "Cannot delete referee with active match assignments"
}
```

---

## **TypeScript Interfaces**

```typescript
// Tournament Referee Model
interface TournamentReferee {
  id: number;
  tournamentId: number;
  refereeId: number;
  role: 'main' | 'assistant';
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  referee?: User;
  tournament?: Tournament;
}

// Create Tournament Referee Request
interface CreateTournamentRefereeRequest {
  tournamentId: number;
  refereeId: number;
  role: 'main' | 'assistant';
}

// Assign Multiple Referees Request
interface AssignRefereesRequest {
  tournamentId: number;
  refereeIds: number[];
}

// Update Tournament Referee Request
interface UpdateTournamentRefereeRequest {
  role?: 'main' | 'assistant';
  isAvailable?: boolean;
}

// Update Availability Request
interface UpdateAvailabilityRequest {
  isAvailable: boolean;
}
```

---

## **Workflow: Phân công trọng tài cho giải đấu**

```
1. Assign referees to tournament
   POST /api/tournament-referees/assign
   → List of referees added with isAvailable = true

2. (Optional) Update referee roles
   PUT /api/tournament-referees/{id}
   → Change from assistant to main

3. When creating matches, get available referees
   GET /api/tournament-referees/tournament/{tournamentId}/available
   → List of available referees to assign

4. Assign umpire to match
   POST /api/matches/{id}/start
   → System auto-assigns available referees as umpire/assistant

5. If referee becomes unavailable
   PATCH /api/tournament-referees/{id}/availability
   → isAvailable = false
```

---

## **Common Use Cases**

### **Use Case 1: Setup trọng tài cho giải đấu**

```javascript
// 1. Get list of users with referee role
const referees = await fetch('/api/users?roleId=3'); // roleId=3 is referee

// 2. Assign all to tournament
await fetch('/api/tournament-referees/assign', {
  method: 'POST',
  body: JSON.stringify({
    tournamentId: 1,
    refereeIds: referees.map(r => r.id)
  })
});

// 3. Set main referee
await fetch('/api/tournament-referees/1', {
  method: 'PUT',
  body: JSON.stringify({ role: 'main' })
});
```

### **Use Case 2: Toggle availability**

```javascript
const toggleAvailability = async (refereeId, currentStatus) => {
  await fetch(`/api/tournament-referees/${refereeId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ isAvailable: !currentStatus })
  });
};
```

### **Use Case 3: Dropdown chọn trọng tài cho match**

```javascript
const getRefereesForDropdown = async (tournamentId, excludeIds = []) => {
  const excludeParam = excludeIds.length > 0 
    ? `?excludeIds=${excludeIds.join(',')}`
    : '';
  
  const response = await fetch(
    `/api/tournament-referees/tournament/${tournamentId}/available${excludeParam}`
  );
  
  return response.json();
};
```

---

## **Relationship với Match**

Tournament Referee khác với Match Umpire:

| Concept            | Table                | Description                           |
| ------------------ | -------------------- | ------------------------------------- |
| Tournament Referee | `tournament_referees`| Trọng tài đăng ký tham gia giải đấu   |
| Match Umpire       | `matches.umpire`     | Trọng tài điều khiển trận đấu cụ thể  |
| Assistant Umpire   | `matches.assistantUmpire` | Trợ lý trọng tài trong trận đấu |

**Flow:**
1. Trọng tài đăng ký → `tournament_referees` record được tạo
2. Khi match bắt đầu → `matches.umpire` được assign từ available referees
3. System checks `isAvailable = true` khi auto-assign
