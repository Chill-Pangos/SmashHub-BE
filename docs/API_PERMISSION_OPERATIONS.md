# 📘 API Documentation - Permission Management

Tài liệu này mô tả các API để **quản lý quyền (Permissions)** trong hệ thống.

> 📝 **Lưu ý quan trọng:**
>
> - Permissions là các quyền hạn cụ thể (ví dụ: `users.view`, `tournaments.manage`)
> - Permissions được gán cho Roles (vai trò), không gán trực tiếp cho Users
> - Mỗi API endpoint được bảo vệ bởi permission check

---

## **Available Permissions**

| Permission Code          | Description                       | Truy Cập              |
| ------------------------ | --------------------------------- | --------------------- |
| `users.view`             | Xem thông tin người dùng          | Admin                 |
| `users.create`           | Tạo mới người dùng                | Admin                 |
| `users.update`           | Cập nhật thông tin người dùng     | Admin                 |
| `users.delete`           | Xóa người dùng                    | Admin                 |
| `tournaments.view`       | Xem danh sách giải đấu            | Public                |
| `tournaments.create`     | Tạo giải đấu mới                  | Organizer             |
| `tournaments.update`     | Cập nhật giải đấu                 | Organizer             |
| `tournaments.delete`     | Xóa giải đấu                      | Organizer             |
| `tournaments.manage`     | Quản lý giải đấu (full access)    | Organizer             |
| `matches.view`           | Xem thông tin trận đấu            | Public                |
| `matches.create`         | Tạo trận đấu mới                  | Organizer             |
| `matches.update`         | Cập nhật trận đấu                 | Organizer             |
| `matches.delete`         | Xóa trận đấu                      | Organizer             |
| `matches.start`          | Bắt đầu trận đấu                  | Referee               |
| `matches.report_result`  | Báo cáo kết quả trận đấu          | Referee               |
| `matches.approve_result` | Phê duyệt kết quả trận đấu        | Chief Referee         |
| `schedules.view`         | Xem lịch thi đấu                  | Public                |
| `schedules.create`       | Tạo lịch thi đấu                  | Organizer             |
| `schedules.update`       | Cập nhật lịch thi đấu             | Organizer             |
| `schedules.delete`       | Xóa lịch thi đấu                  | Organizer             |
| `entries.view`           | Xem danh sách đội tham gia        | Public                |
| `entries.create`         | Tạo đội tham gia giải             | Team Manager          |
| `entries.update`         | Cập nhật đội tham gia             | Team Manager          |
| `entries.delete`         | Xóa đội tham gia                  | Team Manager          |
| `entries.approve`        | Phê duyệt đội tham gia            | Organizer             |
| `teams.view`             | Xem thông tin đội                 | Public                |
| `teams.create`           | Tạo đội mới                       | Team Manager          |
| `teams.update`           | Cập nhật thông tin đội            | Team Manager          |
| `teams.delete`           | Xóa đội                           | Team Manager          |
| `teams.manage_members`   | Quản lý thành viên trong đội      | Team Manager          |
| `complaints.view`        | Xem khiếu nại                     | Organizer             |
| `complaints.create`      | Tạo khiếu nại                     | Any User              |
| `complaints.update`      | Cập nhật khiếu nại                | Creator/Organizer     |
| `complaints.resolve`     | Giải quyết khiếu nại              | Organizer             |
| `complaints.assign`      | Gán khiếu nại cho người xử lý     | Organizer             |
| `elo.view`               | Xem điểm ELO                      | Public                |
| `elo.manage`             | Quản lý điểm ELO                  | Admin                 |
| `roles.view`             | Xem danh sách roles               | Admin                 |
| `roles.create`           | Tạo role mới                      | Admin                 |
| `roles.update`           | Cập nhật role                     | Admin                 |
| `roles.delete`           | Xóa role                          | Admin                 |
| `permissions.view`       | Xem danh sách permissions         | Admin                 |
| `permissions.manage`     | Quản lý permissions (full access) | Admin                 |
| `notifications.view`     | Xem thông báo                     | Any User              |
| `notifications.send`     | Gửi thông báo                     | Admin/Organizer       |
| `content.view`           | Xem nội dung                      | Public                |
| `content.create`         | Tạo nội dung                      | Admin/Content Manager |
| `content.update`         | Cập nhật nội dung                 | Admin/Content Manager |
| `content.delete`         | Xóa nội dung                      | Admin/Content Manager |

---

## **Table of Contents**

1. [Create Permission](#1-create-permission)
2. [Get All Permissions](#2-get-all-permissions)
3. [Get Permission by ID](#3-get-permission-by-id)
4. [Update Permission](#4-update-permission)
5. [Delete Permission](#5-delete-permission)

---

## **1. Create Permission**

### **Endpoint**

```
POST /api/permissions
```

### **Authentication**

✅ **Required** - Bearer Token

### **Authorization**

✅ **Required** - `permissions.manage`

Chỉ **Admin** hoặc người có quyền `permissions.manage` mới có thể tạo permissions.

### **Description**

Tạo quyền (permission) mới trong hệ thống.

### **Request Body**

| Field  | Type   | Required | Description        |
| ------ | ------ | -------- | ------------------ |
| `name` | string | Yes      | Tên của permission |

### **Request Example**

```json
{
  "name": "tournaments.manage"
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "name": "tournaments.manage",
  "createdAt": "2024-06-15T10:00:00.000Z",
  "updatedAt": "2024-06-15T10:00:00.000Z"
}
```

### **Error Responses**

**400 Bad Request - Permission already exists**

```json
{
  "message": "Permission already exists"
}
```

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

---

## **2. Get All Permissions**

### **Endpoint**

```
GET /api/permissions
```

### **Authentication**

❌ **Not Required** (Public API)

### **Description**

Lấy danh sách tất cả permissions với pagination.

### **Query Parameters**

| Parameter | Type    | Default | Description       |
| --------- | ------- | ------- | ----------------- |
| `skip`    | integer | 0       | Số records bỏ qua |
| `limit`   | integer | 10      | Số records tối đa |

### **Request Example**

```http
GET /api/permissions?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "name": "tournaments.manage",
    "createdAt": "2024-06-15T10:00:00.000Z",
    "updatedAt": "2024-06-15T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "matches.approve_result",
    "createdAt": "2024-06-15T10:00:00.000Z",
    "updatedAt": "2024-06-15T10:00:00.000Z"
  },
  {
    "id": 3,
    "name": "users.view",
    "createdAt": "2024-06-15T10:00:00.000Z",
    "updatedAt": "2024-06-15T10:00:00.000Z"
  }
]
```

### **Error Responses**

**500 Internal Server Error**

```json
{
  "message": "Error fetching permissions"
}
```

---

## **3. Get Permission by ID**

### **Endpoint**

```
GET /api/permissions/{id}
```

### **Authentication**

❌ **Not Required** (Public API)

### **Description**

Lấy thông tin chi tiết của một permission theo ID.

### **Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Permission ID |

### **Request Example**

```http
GET /api/permissions/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "name": "tournaments.manage",
  "createdAt": "2024-06-15T10:00:00.000Z",
  "updatedAt": "2024-06-15T10:00:00.000Z"
}
```

### **Error Responses**

**404 Not Found**

```json
{
  "message": "Permission not found"
}
```

**500 Internal Server Error**

```json
{
  "message": "Error fetching permission"
}
```

---

## **4. Update Permission**

### **Endpoint**

```
PUT /api/permissions/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Authorization**

✅ **Required** - `permissions.manage`

Chỉ **Admin** hoặc người có quyền `permissions.manage` mới có thể cập nhật permissions.

### **Description**

Cập nhật thông tin của một permission.

### **Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Permission ID |

### **Request Body**

| Field  | Type   | Required | Description            |
| ------ | ------ | -------- | ---------------------- |
| `name` | string | No       | Tên mới của permission |

### **Request Example**

```json
{
  "name": "tournaments.manage_referees"
}
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "name": "tournaments.manage_referees",
  "createdAt": "2024-06-15T10:00:00.000Z",
  "updatedAt": "2024-06-15T10:15:00.000Z"
}
```

### **Error Responses**

**400 Bad Request - Permission already exists**

```json
{
  "message": "Permission already exists"
}
```

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

**404 Not Found**

```json
{
  "message": "Permission not found"
}
```

---

## **5. Delete Permission**

### **Endpoint**

```
DELETE /api/permissions/{id}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Authorization**

✅ **Required** - `permissions.manage`

Chỉ **Admin** hoặc người có quyền `permissions.manage` mới có thể xóa permissions.

### **Description**

Xóa một permission khỏi hệ thống.

### **Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Permission ID |

### **Request Example**

```http
DELETE /api/permissions/1
```

### **Response - 204 No Content**

```
(Empty body)
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

**404 Not Found**

```json
{
  "message": "Permission not found"
}
```

**500 Internal Server Error**

```json
{
  "message": "Error deleting permission"
}
```

---

## **Implementation Notes**

### **Permission Inheritance**

- Permissions không được inherit, mà được gán trực tiếp cho Roles
- User kế thừa permissions từ các Roles mà họ được gán

### **Best Practices**

1. **Naming Convention**: Sử dụng format `resource.action` (ví dụ: `tournaments.manage`)
2. **Granularity**: Tạo permissions cụ thể để dễ quản lý
3. **Documentation**: Luôn document mục đích của permission mới
4. **Validation**: Kiểm tra duplicate permissions trước khi tạo

### **Common Patterns**

```
Read operations:   {resource}.view
Create:           {resource}.create
Update:           {resource}.update
Delete:           {resource}.delete
Full management:  {resource}.manage
```

---

## **Related APIs**

- [Role Management](./API_ROLE_OPERATIONS.md) - Quản lý vai trò
- [User Management](./API_USER_OPERATIONS.md) - Quản lý người dùng
