# 📘 API Documentation - Role Operations

Tài liệu này mô tả các API để **quản lý roles** (vai trò) trong hệ thống SmashHub.

---

## **Table of Contents**

1. [Create Role](#1-create-role)
2. [Get All Roles](#2-get-all-roles)
3. [Get Role by ID](#3-get-role-by-id)
4. [Get Role by Name](#4-get-role-by-name)
5. [Update Role](#5-update-role)
6. [Delete Role](#6-delete-role)

---

## **1. Create Role**

### **Endpoint**

```
POST /api/roles
```

### **Authentication**

❌ **Not Required** (Có thể cần thêm authentication trong production)

### **Description**

Tạo một role mới trong hệ thống. Role được sử dụng để phân quyền và quản lý user.

### **Request Body**

#### **TypeScript Interface**

```typescript
interface CreateRoleDto {
  name: string; // Required - Tên role (unique)
  description?: string; // Optional - Mô tả về role
}
```

#### **Field Descriptions**

| Field         | Type   | Required | Description                                    |
| ------------- | ------ | -------- | ---------------------------------------------- |
| `name`        | string | ✅ Yes   | Tên role, phải unique (ví dụ: "Admin", "User") |
| `description` | string | ❌ No    | Mô tả chi tiết về role và quyền hạn            |

### **Request Example**

```json
{
  "name": "Tournament Manager",
  "description": "Can create, update and manage tournaments"
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "name": "Tournament Manager",
  "description": "Can create, update and manage tournaments",
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T10:00:00.000Z"
}
```

### **Error Responses**

#### **400 Bad Request** - Validation errors

```json
{
  "message": "Error creating role",
  "error": {
    "name": "SequelizeUniqueConstraintError",
    "message": "Role name already exists"
  }
}
```

#### **400 Bad Request** - Missing required fields

```json
{
  "message": "Error creating role",
  "error": "name is required"
}
```

---

## **2. Get All Roles**

### **Endpoint**

```
GET /api/roles
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tất cả roles trong hệ thống với pagination.

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/roles?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "name": "Admin",
    "description": "Full system access",
    "createdAt": "2026-01-10T08:00:00.000Z",
    "updatedAt": "2026-01-10T08:00:00.000Z"
  },
  {
    "id": 2,
    "name": "User",
    "description": "Basic user access",
    "createdAt": "2026-01-10T08:00:00.000Z",
    "updatedAt": "2026-01-10T08:00:00.000Z"
  },
  {
    "id": 3,
    "name": "Tournament Manager",
    "description": "Can create, update and manage tournaments",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
]
```

### **Response Structure**

Returns an array of role objects. Each role contains:

| Field         | Type    | Description                          |
| ------------- | ------- | ------------------------------------ |
| `id`          | integer | Unique role ID                       |
| `name`        | string  | Role name                            |
| `description` | string  | Role description (có thể null)       |
| `createdAt`   | string  | ISO 8601 timestamp khi tạo           |
| `updatedAt`   | string  | ISO 8601 timestamp khi cập nhật cuối |

### **Error Responses**

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching roles",
  "error": {}
}
```

---

## **3. Get Role by ID**

### **Endpoint**

```
GET /api/roles/{id}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin chi tiết của một role theo ID.

### **Path Parameters**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `id`      | integer | ✅ Yes   | ID của role cần lấy |

### **Request Example**

```http
GET /api/roles/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "name": "Admin",
  "description": "Full system access",
  "createdAt": "2026-01-10T08:00:00.000Z",
  "updatedAt": "2026-01-10T08:00:00.000Z"
}
```

### **Error Responses**

#### **404 Not Found** - Role không tồn tại

```json
{
  "message": "Role not found"
}
```

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching role",
  "error": {}
}
```

---

## **4. Get Role by Name**

### **Endpoint**

```
GET /api/roles/name/{name}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin role theo tên. Endpoint này hữu ích khi bạn cần check xem một role name có tồn tại hay không, hoặc lấy ID của role theo tên.

### **Path Parameters**

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `name`    | string | ✅ Yes   | Tên role cần tìm (exact match) |

### **Request Examples**

```http
GET /api/roles/name/Admin
```

```http
GET /api/roles/name/Tournament%20Manager
```

> 💡 **Lưu ý:** Nếu tên role có khoảng trắng, cần encode URL (space → %20)

### **Response - 200 OK**

```json
{
  "id": 1,
  "name": "Admin",
  "description": "Full system access",
  "createdAt": "2026-01-10T08:00:00.000Z",
  "updatedAt": "2026-01-10T08:00:00.000Z"
}
```

### **Error Responses**

#### **400 Bad Request** - Missing or invalid name

```json
{
  "message": "Role name is required"
}
```

#### **404 Not Found** - Role không tồn tại

```json
{
  "message": "Role not found"
}
```

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching role",
  "error": {}
}
```

---

## **5. Update Role**

### **Endpoint**

```
PUT /api/roles/{id}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication trong production)

### **Description**

Cập nhật thông tin của một role. Có thể cập nhật tên và/hoặc mô tả.

### **Path Parameters**

| Parameter | Type    | Required | Description            |
| --------- | ------- | -------- | ---------------------- |
| `id`      | integer | ✅ Yes   | ID của role cần update |

### **Request Body**

#### **TypeScript Interface**

```typescript
interface UpdateRoleDto {
  name?: string; // Optional - Tên role mới (phải unique)
  description?: string; // Optional - Mô tả mới
}
```

#### **Field Descriptions**

| Field         | Type   | Required | Description                             |
| ------------- | ------ | -------- | --------------------------------------- |
| `name`        | string | ❌ No    | Tên role mới (phải unique nếu thay đổi) |
| `description` | string | ❌ No    | Mô tả mới về role                       |

> 💡 **Lưu ý:** Ít nhất một trong hai field phải được cung cấp

### **Request Examples**

#### **Example 1: Update name only**

```json
{
  "name": "Super Admin"
}
```

#### **Example 2: Update description only**

```json
{
  "description": "Full system access with all permissions"
}
```

#### **Example 3: Update both**

```json
{
  "name": "Tournament Organizer",
  "description": "Can create, manage tournaments and view statistics"
}
```

### **Response - 200 OK**

```json
[
  1,
  [
    {
      "id": 1,
      "name": "Super Admin",
      "description": "Full system access with all permissions",
      "createdAt": "2026-01-10T08:00:00.000Z",
      "updatedAt": "2026-01-14T11:30:00.000Z"
    }
  ]
]
```

> 📝 **Response Format:** Sequelize trả về array với:
>
> - `[0]`: Số lượng rows được update (1)
> - `[1]`: Array chứa role object đã update

### **Error Responses**

#### **404 Not Found** - Role không tồn tại

```json
{
  "message": "Role not found"
}
```

#### **400 Bad Request** - Validation error

```json
{
  "message": "Error updating role",
  "error": {
    "name": "SequelizeUniqueConstraintError",
    "message": "Role name already exists"
  }
}
```

---

## **6. Delete Role**

### **Endpoint**

```
DELETE /api/roles/{id}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication + authorization trong production)

### **Description**

Xóa một role khỏi hệ thống.

> ⚠️ **Cảnh báo:** Nếu role đang được sử dụng bởi users, việc xóa có thể gây lỗi do foreign key constraint. Nên kiểm tra trước khi xóa.

### **Path Parameters**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `id`      | integer | ✅ Yes   | ID của role cần xóa |

### **Request Example**

```http
DELETE /api/roles/5
```

### **Response - 204 No Content**

Không có response body. HTTP status 204 nghĩa là đã xóa thành công.

### **Error Responses**

#### **404 Not Found** - Role không tồn tại

```json
{
  "message": "Role not found"
}
```

#### **500 Internal Server Error** - Foreign key constraint

```json
{
  "message": "Error deleting role",
  "error": {
    "name": "SequelizeForeignKeyConstraintError",
    "message": "Cannot delete role that is assigned to users"
  }
}
```

---

## **TypeScript Interfaces Summary**

### **Role Model**

```typescript
interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### **DTOs**

```typescript
// Create Role
interface CreateRoleDto {
  name: string;
  description?: string;
}

// Update Role
interface UpdateRoleDto {
  name?: string;
  description?: string;
}

// Response
interface RoleResponseDto {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## **Common Use Cases**

### **Use Case 1: Check if role exists before creating**

```typescript
// Step 1: Check by name
const checkResponse = await fetch("/api/roles/name/Tournament Manager");

if (checkResponse.status === 404) {
  // Step 2: Create if not exists
  const createResponse = await fetch("/api/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tournament Manager",
      description: "Manages tournaments",
    }),
  });
}
```

### **Use Case 2: List all roles for dropdown**

```typescript
const response = await fetch("/api/roles?skip=0&limit=100");
const roles = await response.json();

// Use in select dropdown
const roleOptions = roles.map((role) => ({
  value: role.id,
  label: role.name,
}));
```

### **Use Case 3: Update role name safely**

```typescript
const roleId = 1;

try {
  const response = await fetch(`/api/roles/${roleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "New Role Name",
      description: "Updated description",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Update failed:", error.message);
  }
} catch (error) {
  console.error("Request failed:", error);
}
```

### **Use Case 4: Delete role with confirmation**

```typescript
const roleId = 5;

// Step 1: Confirm with user
if (confirm("Are you sure you want to delete this role?")) {
  try {
    const response = await fetch(`/api/roles/${roleId}`, {
      method: "DELETE",
    });

    if (response.status === 204) {
      console.log("Role deleted successfully");
    } else if (response.status === 404) {
      console.log("Role not found");
    } else {
      const error = await response.json();
      console.error("Delete failed:", error);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}
```

---

## **Best Practices**

### **1. Validation**

```typescript
// Always validate input before sending
function validateRoleName(name: string): boolean {
  if (!name || name.trim().length === 0) {
    return false;
  }
  if (name.length > 50) {
    return false;
  }
  return true;
}
```

### **2. Error Handling**

```typescript
async function createRole(data: CreateRoleDto) {
  try {
    const response = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to create role:", error);
    throw error;
  }
}
```

### **3. Pagination**

```typescript
// Fetch all roles with pagination
async function getAllRoles() {
  let allRoles = [];
  let skip = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`/api/roles?skip=${skip}&limit=${limit}`);
    const roles = await response.json();

    allRoles = [...allRoles, ...roles];
    hasMore = roles.length === limit;
    skip += limit;
  }

  return allRoles;
}
```

---

## **Security Considerations**

> ⚠️ **Production Requirements:**

1. **Authentication**: Thêm JWT authentication cho tất cả endpoints
2. **Authorization**: Chỉ Admin mới có quyền tạo/sửa/xóa roles
3. **Input Validation**: Validate và sanitize tất cả input
4. **Rate Limiting**: Giới hạn số request để tránh abuse
5. **Audit Log**: Log tất cả thao tác CRUD với roles

**Example with Authentication:**

```typescript
const response = await fetch("/api/roles", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(roleData),
});
```

---

## **HTTP Status Codes Summary**

| Status Code | Meaning        | When Used                        |
| ----------- | -------------- | -------------------------------- |
| 200         | OK             | GET, PUT successful              |
| 201         | Created        | POST successful                  |
| 204         | No Content     | DELETE successful                |
| 400         | Bad Request    | Invalid input, validation errors |
| 404         | Not Found      | Role không tồn tại               |
| 500         | Internal Error | Server error, database error     |

---

## **Related Models**

Roles có relationship với:

- **Users**: Many-to-Many qua `UserRole` table
- **Permissions**: Many-to-Many qua `RolePermission` table

```typescript
// Role với Users
interface UserRole {
  userId: number;
  roleId: number;
}

// Role với Permissions
interface RolePermission {
  roleId: number;
  permissionId: number;
}
```

---

## **Testing**

### **Manual Testing with cURL**

```bash
# Create role
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Role","description":"For testing"}'

# Get all roles
curl http://localhost:3000/api/roles

# Get role by ID
curl http://localhost:3000/api/roles/1

# Get role by name
curl http://localhost:3000/api/roles/name/Admin

# Update role
curl -X PUT http://localhost:3000/api/roles/1 \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated description"}'

# Delete role
curl -X DELETE http://localhost:3000/api/roles/1
```

---

## **Frontend Implementation Example (React)**

```typescript
import { useState, useEffect } from "react";

interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all roles
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/roles?skip=0&limit=100");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (name: string, description: string) => {
    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        await fetchRoles(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

  const deleteRole = async (id: number) => {
    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
      });

      if (response.status === 204) {
        await fetchRoles(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to delete role:", error);
    }
  };

  return (
    <div>
      <h1>Role Management</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {roles.map((role) => (
            <li key={role.id}>
              <strong>{role.name}</strong>
              {role.description && <p>{role.description}</p>}
              <button onClick={() => deleteRole(role.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

**Last Updated**: January 14, 2026  
**API Version**: 1.0.0
