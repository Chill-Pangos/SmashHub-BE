# 📘 API Documentation - Tournament Referee Operations

Tài liệu này mô tả các API để **quản lý trọng tài trong giải đấu (Tournament Referees)**.

> 📝 **Lưu ý quan trọng:**
>
> - **Tournament Referee** khác với **Match Umpire** (trọng tài điều khiển trận đấu)
> - **Tournament Referee** là danh sách trọng tài **đăng ký tham gia giải đấu**
> - Có 2 roles: **main** (Tổng trọng tài) và **assistant** (Trọng tài)
> - Hỗ trợ tracking **availability** (tình trạng sẵn sàng)
> - **Permission Required**: `tournaments.manage` (Organizer/Admin only)

---

## **Referee Roles**

| Role        | Description                                    | Cách Thêm                                        |
| ----------- | ---------------------------------------------- | ------------------------------------------------ |
| `main`      | Tổng trọng tài - điều khiển giải đấu toàn bộ | POST /tournament-referees (một người một lần)  |
| `assistant` | Trọng tài - hỗ trợ tổng trọng tài              | POST /tournament-referees/assign (nhiều cùng lúc) |

---

## **Table of Contents**

1. [Get Available Chief Referees](#1-get-available-chief-referees)
2. [Create Tournament Referee (Add Chief Referee)](#2-create-tournament-referee-add-chief-referee)
3. [Assign Multiple Referees](#3-assign-multiple-referees)
4. [Get All Tournament Referees](#4-get-all-tournament-referees)
5. [Get Referees by Tournament ID](#5-get-referees-by-tournament-id)
6. [Get Available Referees](#6-get-available-referees)
7. [Get Tournament Referee by ID](#7-get-tournament-referee-by-id)
8. [Update Tournament Referee](#8-update-tournament-referee)
9. [Update Referee Availability](#9-update-referee-availability)
10. [Delete Tournament Referee](#10-delete-tournament-referee)

---

## **1. Get Available Chief Referees**

### **Endpoint**

```
GET /api/tournament-referees/available-chief-referees
```

### **Authentication**

✅ **Required** - Bearer Token

### **Authorization**

✅ **Required** - `tournaments.manage`

Chỉ **Organizer** hoặc **Admin** mới có thể xem danh sách chief referees sẵn sàng.

### **Description**

Lấy danh sách tất cả **Tổng trọng tài (Chief Referees)** chưa được gán vào bất kỳ giải đấu nào với role `main`.

**Dùng API này khi:**

- Tổ chức giải đấu mới muốn chuẩn bị danh sách tổng trọng tài khả dụng
- Cần chọn tổng trọng tài để gán vào giải đấu qua endpoint `POST /tournament-referees`
- Hiển thị dropdown chọn tổng trọng tài trên UI

### **Request Example**

```http
GET /api/tournament-referees/available-chief-referees
Authorization: Bearer {token}
```

### **Response - 200 OK**

```json
[
  {
    "id": 5,
    "username": "referee_main_1",
    "email": "referee1@example.com",
    "avatarUrl": "https://example.com/avatar/5.jpg",
    "phoneNumber": "0123456789"
  },
  {
    "id": 8,
    "username": "referee_main_2",
    "email": "referee2@example.com",
    "avatarUrl": "https://example.com/avatar/8.jpg",
    "phoneNumber": "0987654321"
  },
  {
    "id": 10,
    "username": "referee_main_3",
    "email": "referee3@example.com",
    "avatarUrl": null,
    "phoneNumber": null
  }
]
```

### **Error Responses**

**401 Unauthorized - Missing authentication**

```json
{
  "message": "Authentication required"
}
```

**403 Forbidden - Insufficient permissions**

```json
{
  "message": "You do not have permission to perform this action"
}
```

**500 Internal Server Error**

```json
{
  "message": "Error fetching available chief referees"
}
```

---

## **2. Create Tournament Referee (Add Chief Referee)**

### **Endpoint**

```
POST /api/tournament-referees
```

### **Authentication**

✅ **Required** - Bearer Token

### **Authorization**

✅ **Required** - `tournaments.manage`

Chỉ **Organizer** hoặc **Admin** mới có thể thêm tổng trọng tài vào giải đấu.

### **Description**

Thêm một **Tổng trọng tài** vào giải đấu. Endpoint này **luôn** tạo tournament referee với role `main`.

**Workflow:**

1. Tổ chức giải đấu gọi `GET /tournament-referees/available-chief-referees` để lấy danh sách
2. Chọn một chief referee từ dropdown
3. Gọi `POST /tournament-referees` để thêm vào giải đấu
4. Sau đó, gọi `POST /tournament-referees/assign` để thêm các trọng tài hỗ trợ (role = assistant)

### **Request Body**

| Field          | Type    | Required | Description                          |
| -------------- | ------- | -------- | ------------------------------------ |
| `tournamentId` | integer | Yes      | ID của tournament                    |
| `refereeId`    | integer | Yes      | User ID của tổng trọng tài           |
| `role`         | string  | Yes      | **Phải là** `main`                   |

### **Request Example**

```json
{
  "tournamentId": 1,
  "refereeId": 5,
  "role": "main"
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "tournamentId": 1,
  "refereeId": 5,
  "role": "main",
  "isAvailable": true,
  "createdAt": "2024-06-15T10:00:00.000Z",
  "updatedAt": "2024-06-15T10:00:00.000Z",
  "referee": {
    "id": 5,
    "username": "referee_main_1",
    "email": "referee1@example.com"
  }
}
```

### **Error Responses**

**400 Bad Request - Referee already assigned with role main**

```json
{
  "message": "This referee is already assigned as main referee to another tournament"
}
```

**404 Not Found - Tournament not found**

```json
{
  "message": "Tournament not found"
}
```

**404 Not Found - Referee not found**

```json
{
  "message": "Referee not found"
}
```

**403 Forbidden - Insufficient permissions**

```json
{
  "message": "You do not have permission to perform this action"
}
```

---

## **3. Assign Multiple Referees**

### **Endpoint**

```
POST /api/tournament-referees/assign
```

### **Authentication**

✅ **Required** - Bearer Token

### **Authorization**

✅ **Required** - `tournaments.manage`

Chỉ **Organizer** hoặc **Admin** mới có thể gán trọng tài vào giải đấu.

### **Description**

Phân công nhiều **Trọng tài hỗ trợ** vào giải đấu cùng lúc. Endpoint này **luôn** tạo tournament referees với role `assistant`.

**Lưu ý quan trọng:**

- Tất cả referees được assign sẽ có role `assistant`
- Nếu muốn thêm chief referee (role = main), dùng endpoint `POST /tournament-referees`
- Các referees được tạo với `isAvailable = true` mặc định

**Workflow:**

1. Tổ chức giải đấu đã thêm tổng trọng tài qua `POST /tournament-referees`
2. Gọi `POST /tournament-referees/assign` để thêm danh sách trọng tài hỗ trợ
3. (Optional) Cập nhật availability nếu cần qua `PATCH /tournament-referees/{id}/availability`

### **Request Body**

| Field          | Type      | Required | Description                       |
| -------------- | --------- | -------- | --------------------------------- |
| `tournamentId` | integer   | Yes      | ID của tournament                 |
| `refereeIds`   | integer[] | Yes      | Array các user IDs của trọng tài  |

### **Request Example**

```json
{
  "tournamentId": 1,
  "refereeIds": [6, 7, 8, 9, 10]
}
```

### **Response - 201 Created**

```json
[
  {
    "id": 2,
    "tournamentId": 1,
    "refereeId": 6,
    "role": "assistant",
    "isAvailable": true,
    "createdAt": "2024-06-15T10:05:00.000Z",
    "updatedAt": "2024-06-15T10:05:00.000Z",
    "referee": {
      "id": 6,
      "username": "referee_tran",
      "email": "tran@example.com"
    }
  },
  {
    "id": 3,
    "tournamentId": 1,
    "refereeId": 7,
    "role": "assistant",
    "isAvailable": true,
    "createdAt": "2024-06-15T10:05:00.000Z",
    "updatedAt": "2024-06-15T10:05:00.000Z",
    "referee": {
      "id": 7,
      "username": "referee_le",
      "email": "le@example.com"
    }
  },
  {
    "id": 4,
    "tournamentId": 1,
    "refereeId": 8,
    "role": "assistant",
    "isAvailable": true,
    "createdAt": "2024-06-15T10:05:00.000Z",
    "updatedAt": "2024-06-15T10:05:00.000Z",
    "referee": {
      "id": 8,
      "username": "referee_pham",
      "email": "pham@example.com"
    }
  }
]
```

### **Error Responses**

**400 Bad Request - Some referees already assigned**

```json
{
  "message": "Some referees are already assigned to this tournament",
  "existingRefereeIds": [6, 7]
}
```

**404 Not Found - Tournament not found**

```json
{
  "message": "Tournament not found"
}
```

**403 Forbidden - Insufficient permissions**

```json
{
  "message": "You do not have permission to perform this action"
}
```

---

## **4. Get All Tournament Referees**

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
[
  {
    "id": 1,
    "tournamentId": 1,
    "refereeId": 5,
    "role": "main",
    "isAvailable": true,
    "createdAt": "2024-06-15T10:00:00.000Z",
    "updatedAt": "2024-06-15T10:00:00.000Z",
    "referee": {
      "id": 5,
      "username": "referee_main_1",
      "email": "referee1@example.com"
    }
  },
  {
    "id": 2,
    "tournamentId": 1,
    "refereeId": 6,
    "role": "assistant",
    "isAvailable": true,
    "createdAt": "2024-06-15T10:05:00.000Z",
    "updatedAt": "2024-06-15T10:05:00.000Z",
    "referee": {
      "id": 6,
      "username": "referee_tran",
      "email": "tran@example.com"
    }
  }
]
```

---

## **5. Get Referees by Tournament ID**

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

### **Request Example**

```http
GET /api/tournament-referees/tournament/1?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "tournamentId": 1,
    "refereeId": 5,
    "role": "main",
    "isAvailable": true,
    "createdAt": "2024-06-15T10:00:00.000Z",
    "updatedAt": "2024-06-15T10:00:00.000Z",
    "referee": {
      "id": 5,
      "username": "referee_main_1",
      "email": "referee1@example.com"
    }
  },
  {
    "id": 2,
    "refereeId": 6,
    "role": "assistant",
    "isAvailable": true,
    "referee": {
      "id": 6,
      "username": "referee_tran",
      "email": "tran@example.com"
    }
  },
  {
    "id": 3,
    "refereeId": 7,
    "role": "assistant",
    "isAvailable": false,
    "referee": {
      "id": 7,
      "username": "referee_le",
      "email": "le@example.com"
    }
  }
]
```

---

## **6. Get Available Referees\*\***

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
GET /api/tournament-referees/tournament/1/available?excludeIds=5,6
```

### **Response - 200 OK**

```json
[
  {
    "id": 2,
    "tournamentId": 1,
    "refereeId": 7,
    "role": "assistant",
    "isAvailable": true,
    "referee": {
      "id": 7,
      "username": "referee_le",
      "email": "le@example.com"
    }
  },
  {
    "id": 3,
    "tournamentId": 1,
    "refereeId": 8,
    "role": "assistant",
    "isAvailable": true,
    "referee": {
      "id": 8,
      "username": "referee_pham",
      "email": "pham@example.com"
    }
  }
]
```

---

## **7. Get Tournament Referee by ID**

### **Endpoint**

```
GET /api/tournament-referees/{id}
```

### **Authentication**

❌ **Not Required** (Public API)

### **Description**

Lấy thông tin chi tiết của một tournament referee.

### **Path Parameters**

| Parameter | Type    | Required | Description           |
| --------- | ------- | -------- | ---------------------   |
| --------- | ------- | -------- | ----------------------- |
| `id`      | integer | Yes      | Tournament Referee ID   |

### **Request Example**

```http
GET /api/tournament-referees/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "tournamentId": 1,
  "refereeId": 5,
  "role": "main",
  "isAvailable": true,
  "createdAt": "2024-06-15T10:00:00.000Z",
  "updatedAt": "2024-06-15T10:00:00.000Z",
  "referee": {
    "id": 5,
    "username": "referee_main_1",
    "email": "referee1
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
```8

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

| Parameter | Type    | Required | Description           |
| --------- | ------- | -------- | --------------------- |
| `id`      | integer | Yes      | Tournament Referee ID |

### **Request Body**

| Field         | Type    | Required | Description                   |
| ------------- | ------- | -------- | ----------------------------- |
| `role`        | string  | No       | Role: `main` hoặc `assistant` |
| `isAvailable` | boolean | No       | Trạng thái sẵn sàng           |

### **Request Example**

```json
{
  "role": "main",
  "isAvailable": true
}
```
id": 1,
  "tournamentId": 1,
  "refereeId": 5,
  "role": "main",
  "isAvailable": true,
  "updatedAt": "2024-06-15T11:00:00.000Z" "tournamentId": 1,
    "refereeId": 15,
    "role": "main",
    "isAvailable": true,
    "updatedAt": "2024-06-15T11:00:00.000Z"
  }
}
```9

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

| Parameter | Type    | Required | Description           |
| --------- | ------- | -------- | --------------------- |
| `id`      | integer | Yes      | Tournament Referee ID |

### **Request Body**

| Field         | Type    | Required | Description             |
| ------------- | ------- | -------- | ----------------------- |
| `isAvailable` | boolean | Yes      | Trạng thái sẵn sàng mới |

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
   id": 1,
  "refereeId": 5,
  "isAvailable": false,
  "updatedAt": "2024-06-15T11:30:00.000Z"

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

| Parameter | Type    | Required | Description           |
| --------- | ------- | -------- | --------------------- |
| `id`      | integer | Yes      | Tournament Referee ID |

### **Response - 204 No Content**

Không có response body. Status code 204 nghĩa là xóa thành công.

### **Error Responses**

**404 Not Found**

```jsonquest Example**

```http
DELETE /api/tournament-referees/1
```

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

## **Complete Workflow: Setup Trọng Tài Cho Giải Đấu**

```
STEP 1: Get Available Chief Referees
GET /api/tournament-referees/available-chief-referees
→ Returns list of available chief referees for dropdown

STEP 2: Add Chief Referee
POST /api/tournament-referees
{
  "tournamentId": 1,
  "refereeId": 5,
  "role": "main"
}
→ Tournament now has a chief referee

STEP 3: Add Supporting Referees
POST /api/tournament-referees/assign
{
  "tournamentId": 1,
  "refereeIds": [6, 7, 8, 9, 10]
}
→ Multiple referees added as assistants

STEP 4: (Optional) Get Available Referees for Match Assignment
GET /api/tournament-referees/tournament/1/available
→ Returns referees available for match assignments

STEP 5: (Optional) Update Referee Availability
PATCH /api/tournament-referees/{id}/availability
{ "isAvailable": false }
→ Mark referee as unavailable (sick, emergency)
```

---

## **TypeScript Interfaces**

```typescript
// Tournament Referee Model
interface TournamentReferee {
  id: number;
  tournamentId: number;
  refereeId: number;
  role: "main" | "assistant";
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
  role: "main" | "assistant";
}

// Assign Multiple Referees Request
interface AssignRefereesRequest {
  tournamentId: number;
  refereeIds: number[];
}

// Update Tournament Referee Request
interface UpdateTournamentRefereeRequest {
  role?: "main" | "assistant";
  isAvailable?: boolean;
}

// Update Availability Request
interface UpdateAvailabilityRequest {
  isAvailable: boolean;
}

// Available Chief Referees Response
interface AvailableChiefReferee {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
}
```

---

## **Related APIs**

- [Permission Management](./API_PERMISSION_OPERATIONS.md) - Quản lý quyền
- [Tournament Operations](./API_TOURNAMENT_OPERATIONS.md) - Quản lý giải đấu
- [Match Operations](./API_MATCH_OPERATIONS.md) - Quản lý trận đấu