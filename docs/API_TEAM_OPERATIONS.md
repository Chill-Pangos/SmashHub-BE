# 📘 API Documentation - Team Operations

Tài liệu này mô tả các API để **quản lý teams** (đội) trong tournaments.

---

## **Table of Contents**

1. [Create Team](#1-create-team)
2. [Get All Teams](#2-get-all-teams)
3. [Get Team by ID](#3-get-team-by-id)
4. [Get Teams by Tournament ID](#4-get-teams-by-tournament-id)
5. [Update Team](#5-update-team)
6. [Delete Team](#6-delete-team)
7. [Import Teams - Preview](#7-import-teams---preview)
8. [Import Teams - Confirm](#8-import-teams---confirm)

---

## **1. Create Team**

### **Endpoint**

```
POST /api/teams
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication trong production)

### **Description**

Tạo một team mới cho tournament. Mỗi team thuộc về một tournament cụ thể.

### **Request Body**

#### **TypeScript Interface**

```typescript
interface CreateTeamDto {
  tournamentId: number; // Required - ID của tournament
  name: string; // Required - Tên team
  description?: string; // Optional - Mô tả team
}
```

#### **Field Descriptions**

| Field          | Type    | Required | Description                     |
| -------------- | ------- | -------- | ------------------------------- |
| `tournamentId` | integer | ✅ Yes   | ID của tournament team tham gia |
| `name`         | string  | ✅ Yes   | Tên team (max 100 ký tự)        |
| `description`  | string  | ❌ No    | Mô tả về team (max 255 ký tự)   |

### **Request Examples**

#### **Example 1: Team with description**

```json
{
  "tournamentId": 1,
  "name": "Team Alpha",
  "description": "Elite championship team from District 1"
}
```

#### **Example 2: Team without description**

```json
{
  "tournamentId": 1,
  "name": "Team Beta"
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "tournamentId": 1,
  "name": "Team Alpha",
  "description": "Elite championship team from District 1",
  "createdAt": "2026-01-18T10:30:00.000Z",
  "updatedAt": "2026-01-18T10:30:00.000Z"
}
```

### **Error Responses**

#### **400 Bad Request** - Invalid input data

```json
{
  "message": "Error creating team",
  "error": {
    "name": "ValidationError",
    "message": "name is required"
  }
}
```

---

## **2. Get All Teams**

### **Endpoint**

```
GET /api/teams
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tất cả teams với pagination. Response bao gồm thông tin members của mỗi team.

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/teams?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "tournamentId": 1,
    "name": "Team Alpha",
    "description": "Elite championship team",
    "createdAt": "2026-01-16T10:30:00.000Z",
    "updatedAt": "2026-01-16T10:30:00.000Z",
    "members": [
      {
        "id": 1,
        "teamId": 1,
        "userId": 5,
        "role": "team_manager",
        "createdAt": "2026-01-16T10:30:00.000Z",
        "updatedAt": "2026-01-16T10:30:00.000Z"
      },
      {
        "id": 2,
        "teamId": 1,
        "userId": 10,
        "role": "athlete",
        "createdAt": "2026-01-16T10:35:00.000Z",
        "updatedAt": "2026-01-16T10:35:00.000Z"
      }
    ]
  },
  {
    "id": 2,
    "tournamentId": 1,
    "name": "Team Beta",
    "description": "Rising stars team",
    "createdAt": "2026-01-16T11:00:00.000Z",
    "updatedAt": "2026-01-16T11:00:00.000Z",
    "members": []
  }
]
```

### **Response Structure**

Each team includes:

| Field          | Type    | Description                                     |
| -------------- | ------- | ----------------------------------------------- |
| `id`           | integer | Unique team ID                                  |
| `tournamentId` | integer | ID của tournament                               |
| `name`         | string  | Tên team                                        |
| `description`  | string  | Mô tả team (có thể null)                        |
| `createdAt`    | string  | ISO 8601 timestamp khi tạo                      |
| `updatedAt`    | string  | ISO 8601 timestamp khi cập nhật cuối            |
| `members`      | array   | Danh sách team members (bao gồm thông tin role) |

### **Error Responses**

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching teams",
  "error": {}
}
```

---

## **3. Get Team by ID**

### **Endpoint**

```
GET /api/teams/{id}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin chi tiết của một team theo ID, bao gồm danh sách members.

### **Path Parameters**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `id`      | integer | ✅ Yes   | ID của team cần lấy |

### **Request Example**

```http
GET /api/teams/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "tournamentId": 1,
  "name": "Team Alpha",
  "description": "Elite championship team from District 1",
  "createdAt": "2026-01-16T10:30:00.000Z",
  "updatedAt": "2026-01-16T10:30:00.000Z",
  "members": [
    {
      "id": 1,
      "teamId": 1,
      "userId": 5,
      "role": "team_manager",
      "createdAt": "2026-01-16T10:30:00.000Z",
      "updatedAt": "2026-01-16T10:30:00.000Z"
    },
    {
      "id": 2,
      "teamId": 1,
      "userId": 10,
      "role": "coach",
      "createdAt": "2026-01-16T10:35:00.000Z",
      "updatedAt": "2026-01-16T10:35:00.000Z"
    },
    {
      "id": 3,
      "teamId": 1,
      "userId": 15,
      "role": "athlete",
      "createdAt": "2026-01-16T10:40:00.000Z",
      "updatedAt": "2026-01-16T10:40:00.000Z"
    }
  ]
}
```

### **Error Responses**

#### **404 Not Found** - Team không tồn tại

```json
{
  "message": "Team not found"
}
```

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching team",
  "error": {}
}
```

---

## **4. Get Teams by Tournament ID**

### **Endpoint**

```
GET /api/teams/tournament/{tournamentId}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy tất cả teams tham gia một tournament cụ thể.

### **Path Parameters**

| Parameter      | Type    | Required | Description               |
| -------------- | ------- | -------- | ------------------------- |
| `tournamentId` | integer | ✅ Yes   | ID của tournament cần lấy |

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/teams/tournament/1?skip=0&limit=50
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "tournamentId": 1,
    "name": "Team Alpha",
    "description": "Elite championship team",
    "createdAt": "2026-01-16T10:30:00.000Z",
    "updatedAt": "2026-01-16T10:30:00.000Z",
    "members": [
      {
        "id": 1,
        "teamId": 1,
        "userId": 5,
        "role": "team_manager",
        "createdAt": "2026-01-16T10:30:00.000Z",
        "updatedAt": "2026-01-16T10:30:00.000Z"
      }
    ]
  },
  {
    "id": 2,
    "tournamentId": 1,
    "name": "Team Beta",
    "description": "Rising stars",
    "createdAt": "2026-01-16T11:00:00.000Z",
    "updatedAt": "2026-01-16T11:00:00.000Z",
    "members": []
  }
]
```

### **Use Case**

Endpoint này rất hữu ích để:

- Hiển thị danh sách teams trong tournament bracket
- Tạo bảng xếp hạng teams
- Cho phép user chọn team để xem chi tiết

### **Error Responses**

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching teams",
  "error": {}
}
```

---

## **5. Update Team**

### **Endpoint**

```
PUT /api/teams/{id}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication + team manager authorization)

### **Description**

Cập nhật thông tin team (tên và/hoặc mô tả).

### **Path Parameters**

| Parameter | Type    | Required | Description            |
| --------- | ------- | -------- | ---------------------- |
| `id`      | integer | ✅ Yes   | ID của team cần update |

### **Request Body**

#### **TypeScript Interface**

```typescript
interface UpdateTeamDto {
  name?: string; // Optional - Tên team mới
  description?: string; // Optional - Mô tả mới
}
```

#### **Field Descriptions**

| Field         | Type   | Required | Description                  |
| ------------- | ------ | -------- | ---------------------------- |
| `name`        | string | ❌ No    | Tên team mới (max 100 ký tự) |
| `description` | string | ❌ No    | Mô tả mới (max 255 ký tự)    |

> 💡 **Lưu ý:** Ít nhất một trong hai field phải được cung cấp

### **Request Examples**

#### **Example 1: Update name only**

```json
{
  "name": "Team Alpha Elite"
}
```

#### **Example 2: Update both name and description**

```json
{
  "name": "Team Alpha Elite",
  "description": "Championship winning team 2026"
}
```

#### **Example 3: Update description only**

```json
{
  "description": "Updated team description"
}
```

### **Response - 200 OK**

```json
[
  1,
  [
    {
      "id": 1,
      "tournamentId": 1,
      "name": "Team Alpha Elite",
      "description": "Championship winning team 2026",
      "createdAt": "2026-01-16T10:30:00.000Z",
      "updatedAt": "2026-01-18T14:00:00.000Z"
    }
  ]
]
```

> 📝 **Response Format:** Sequelize trả về array với:
>
> - `[0]`: Số lượng rows được update (1)
> - `[1]`: Array chứa team object đã update

### **Error Responses**

#### **404 Not Found** - Team không tồn tại

```json
{
  "message": "Team not found"
}
```

#### **400 Bad Request** - Invalid input data

```json
{
  "message": "Error updating team",
  "error": {}
}
```

---

## **6. Delete Team**

### **Endpoint**

```
DELETE /api/teams/{id}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication + authorization)

### **Description**

Xóa một team khỏi tournament.

> ⚠️ **Cảnh báo:** Việc xóa team sẽ cascade xóa:
>
> - Tất cả team members
> - Tất cả entries của team
> - Có thể ảnh hưởng đến matches nếu team đã tham gia

### **Path Parameters**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `id`      | integer | ✅ Yes   | ID của team cần xóa |

### **Request Example**

```http
DELETE /api/teams/5
```

### **Response - 204 No Content**

Không có response body. HTTP status 204 nghĩa là đã xóa thành công.

### **Error Responses**

#### **404 Not Found** - Team không tồn tại

```json
{
  "message": "Team not found"
}
```

#### **500 Internal Server Error** - Foreign key constraint

```json
{
  "message": "Error deleting team",
  "error": {
    "name": "SequelizeForeignKeyConstraintError",
    "message": "Cannot delete team with active entries"
  }
}
```

---

## **7. Import Teams - Preview**

### **Endpoint**

```
POST /api/teams/import/preview
```

### **Authentication**

✅ **Required** - Bearer token

### **Description**

Upload và preview Excel file chứa danh sách teams và members trước khi import vào database. API sẽ validate dữ liệu và trả về các lỗi nếu có.

### **Request Body (Multipart Form Data)**

| Field  | Type | Required | Description                                             |
| ------ | ---- | -------- | ------------------------------------------------------- |
| `file` | file | ✅ Yes   | Excel file (.xlsx or .xls) chứa danh sách teams/members |

### **Excel File Format**

Excel file cần có các cột sau:

| Column      | Description                          | Required | Example          |
| ----------- | ------------------------------------ | -------- | ---------------- |
| Team Name   | Tên team                             | ✅ Yes   | Team Alpha       |
| Description | Mô tả team                           | ❌ No    | Best team        |
| Member Name | Tên member                           | ✅ Yes   | John Doe         |
| Email       | Email member                         | ✅ Yes   | john@example.com |
| Role        | Vai trò (team_manager/coach/athlete) | ✅ Yes   | team_manager     |

> 💡 **Lưu ý:** Mỗi team có thể có nhiều members trên các dòng khác nhau với cùng Team Name

### **Request Example (cURL)**

```bash
curl -X POST http://localhost:3000/api/teams/import/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@teams.xlsx"
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "teams": [
      {
        "name": "Team Alpha",
        "description": "Best team",
        "members": [
          {
            "teamName": "Team Alpha",
            "memberName": "John Doe",
            "userId": 1,
            "role": "team_manager",
            "email": "john@example.com"
          },
          {
            "teamName": "Team Alpha",
            "memberName": "Jane Smith",
            "userId": 2,
            "role": "athlete",
            "email": "jane@example.com"
          }
        ],
        "rowNumber": 2
      },
      {
        "name": "Team Beta",
        "description": "Rising stars",
        "members": [
          {
            "teamName": "Team Beta",
            "memberName": "Bob Wilson",
            "userId": 3,
            "role": "team_manager",
            "email": "bob@example.com"
          }
        ],
        "rowNumber": 4
      }
    ],
    "errors": [],
    "summary": {
      "totalTeams": 5,
      "totalMembers": 20,
      "teamsWithErrors": 0,
      "membersWithErrors": 0
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
    "teams": [
      {
        "name": "Team Alpha",
        "description": "Best team",
        "members": [
          {
            "teamName": "Team Alpha",
            "memberName": "John Doe",
            "userId": 1,
            "role": "team_manager",
            "email": "john@example.com"
          }
        ],
        "rowNumber": 2
      }
    ],
    "errors": [
      {
        "rowNumber": 5,
        "field": "email",
        "message": "Email không hợp lệ",
        "value": "invalid-email"
      },
      {
        "rowNumber": 7,
        "field": "role",
        "message": "Role phải là team_manager, coach, hoặc athlete",
        "value": "unknown_role"
      }
    ],
    "summary": {
      "totalTeams": 5,
      "totalMembers": 20,
      "teamsWithErrors": 1,
      "membersWithErrors": 2
    }
  }
}
```

### **Validation Rules**

1. **Team Requirements**
   - Team name bắt buộc
   - Mỗi team phải có ít nhất 1 member với role `team_manager`

2. **Member Requirements**
   - Email phải hợp lệ
   - Role phải là: `team_manager`, `coach`, hoặc `athlete`
   - User phải tồn tại trong hệ thống

3. **Duplicate Check**
   - Không cho phép duplicate team names trong cùng một file
   - Không cho phép duplicate members trong cùng một team

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

## **8. Import Teams - Confirm**

### **Endpoint**

```
POST /api/teams/import/confirm
```

### **Authentication**

✅ **Required** - Bearer token

### **Description**

Confirm và lưu danh sách teams và members đã được preview thành công vào database.

### **Request Body**

#### **TypeScript Interface**

```typescript
interface ImportTeamMemberDto {
  teamName: string;
  memberName: string;
  userId: number;
  role: "team_manager" | "coach" | "athlete";
  email: string;
}

interface ImportTeamDto {
  name: string;
  description?: string;
  members: ImportTeamMemberDto[];
  rowNumber: number;
}

interface ConfirmTeamsImportDto {
  tournamentId: number;
  teams: ImportTeamDto[];
}
```

### **Request Example**

```json
{
  "tournamentId": 1,
  "teams": [
    {
      "name": "Team Alpha",
      "description": "Best team",
      "members": [
        {
          "teamName": "Team Alpha",
          "memberName": "John Doe",
          "userId": 1,
          "role": "team_manager",
          "email": "john@example.com"
        },
        {
          "teamName": "Team Alpha",
          "memberName": "Jane Smith",
          "userId": 2,
          "role": "athlete",
          "email": "jane@example.com"
        }
      ],
      "rowNumber": 2
    },
    {
      "name": "Team Beta",
      "description": "Rising stars",
      "members": [
        {
          "teamName": "Team Beta",
          "memberName": "Bob Wilson",
          "userId": 3,
          "role": "team_manager",
          "email": "bob@example.com"
        }
      ],
      "rowNumber": 4
    }
  ]
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "message": "Teams imported successfully",
  "data": {
    "success": true,
    "createdTeams": 5,
    "createdMembers": 20,
    "teamIds": [1, 2, 3, 4, 5]
  }
}
```

### **Business Logic**

1. **Transaction Handling**
   - Tất cả teams và members được tạo trong một transaction
   - Nếu có lỗi, toàn bộ import sẽ rollback

2. **Team Creation**
   - Tạo teams với tên và mô tả từ Excel
   - Link teams với tournament thông qua `tournamentId`

3. **Member Assignment**
   - Tạo team members cho mỗi team
   - Gán role phù hợp cho từng member

### **Error Responses**

#### **400 Bad Request** - Invalid data

```json
{
  "message": "Invalid data or import failed",
  "error": {
    "message": "Tournament not found"
  }
}
```

#### **400 Bad Request** - Duplicate team

```json
{
  "message": "Invalid data or import failed",
  "error": {
    "message": "Team 'Team Alpha' already exists in this tournament"
  }
}
```

#### **401 Unauthorized**

```json
{
  "message": "Unauthorized"
}
```

---

## **TypeScript Interfaces Summary**

### **Team Model**

```typescript
interface Team {
  id: number;
  tournamentId: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  tournament?: Tournament;
  members?: TeamMember[];
}
```

### **Team Member Model**

```typescript
interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: "team_manager" | "coach" | "athlete";
  createdAt: Date;
  updatedAt: Date;
}
```

### **DTOs**

```typescript
// Create Team
interface CreateTeamDto {
  tournamentId: number;
  name: string;
  description?: string;
}

// Update Team
interface UpdateTeamDto {
  name?: string;
  description?: string;
}

// Response
interface TeamResponseDto {
  id: number;
  tournamentId: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## **Common Use Cases**

### **Use Case 1: Create team and add members**

```typescript
// Step 1: Create team
const teamResponse = await fetch("/api/teams", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tournamentId: 1,
    name: "Team Alpha",
    description: "Elite team",
  }),
});

const team = await teamResponse.json();

// Step 2: Add team manager
await fetch("/api/team-members", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    teamId: team.id,
    userId: 5,
    role: "team_manager",
  }),
});

// Step 3: Add athletes
await fetch("/api/team-members", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    teamId: team.id,
    userId: 10,
    role: "athlete",
  }),
});
```

### **Use Case 2: Get all teams for tournament bracket**

```typescript
const tournamentId = 1;
const response = await fetch(
  `/api/teams/tournament/${tournamentId}?skip=0&limit=100`,
);
const teams = await response.json();

// Display in bracket
teams.forEach((team) => {
  console.log(`${team.name} - ${team.members.length} members`);
});
```

### **Use Case 3: Update team info (team manager only)**

```typescript
async function updateTeam(
  teamId: number,
  updates: UpdateTeamDto,
  token: string,
) {
  try {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error("Update failed:", error);
    throw error;
  }
}
```

---

## **Team Roles**

### **Role Types**

| Role           | Description     | Permissions                                      |
| -------------- | --------------- | ------------------------------------------------ |
| `team_manager` | Quản lý team    | Đăng ký entry, quản lý members, update team info |
| `coach`        | Huấn luyện viên | Xem thông tin, không có quyền quản lý            |
| `athlete`      | Vận động viên   | Tham gia thi đấu                                 |

### **Role Assignment Rules**

- Mỗi team phải có ít nhất 1 `team_manager`
- Một user có thể là member của nhiều teams
- Một user có thể có role khác nhau ở các teams khác nhau

### **Use Case 4: Bulk import teams from Excel**

```typescript
async function importTeamsFromExcel(
  tournamentId: number,
  file: File,
  token: string,
) {
  try {
    // Step 1: Upload and preview
    const formData = new FormData();
    formData.append("file", file);

    const previewResponse = await fetch("/api/teams/import/preview", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const preview = await previewResponse.json();

    // Step 2: Show validation summary
    console.log(`Total teams: ${preview.data.summary.totalTeams}`);
    console.log(`Total members: ${preview.data.summary.totalMembers}`);
    console.log(`Teams with errors: ${preview.data.summary.teamsWithErrors}`);
    console.log(
      `Members with errors: ${preview.data.summary.membersWithErrors}`,
    );

    // Step 3: Check for validation errors
    if (!preview.data.valid) {
      console.error("Validation errors:", preview.data.errors);
      return {
        success: false,
        errors: preview.data.errors,
        summary: preview.data.summary,
      };
    }

    // Step 4: User confirms, proceed with import
    const confirmResponse = await fetch("/api/teams/import/confirm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tournamentId,
        teams: preview.data.teams,
      }),
    });

    const result = await confirmResponse.json();

    if (result.success) {
      console.log(`Created ${result.data.createdTeams} teams`);
      console.log(`Created ${result.data.createdMembers} members`);
    }

    return result;
  } catch (error) {
    console.error("Import failed:", error);
    throw error;
  }
}
```

### **Use Case 5: Validate Excel before import**

```typescript
async function validateTeamImport(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/teams/import/preview", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json();

  // Return validation results
  return {
    valid: data.data.valid,
    teams: data.data.teams,
    errors: data.data.errors,
    summary: data.data.summary,
    canProceed: data.data.valid && data.data.summary.teamsWithErrors === 0,
  };
}
```

---

## **Frontend Implementation Example (React)**

```typescript
import { useState, useEffect } from 'react';

interface Team {
  id: number;
  tournamentId: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
}

interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: string;
  createdAt: string;
  updatedAt: string;
}

function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch teams by tournament
  const fetchTeamsByTournament = async (tournamentId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/tournament/${tournamentId}`);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new team
  const createTeam = async (tournamentId: number, name: string, description?: string) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, name, description })
      });

      if (response.status === 201) {
        const newTeam = await response.json();
        setTeams([...teams, newTeam]);
        return newTeam;
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  // Update team
  const updateTeam = async (id: number, updates: UpdateTeamDto) => {
    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await fetchTeamsByTournament(teams[0]?.tournamentId);
      }
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  // Delete team
  const deleteTeam = async (id: number) => {
    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'DELETE'
      });

      if (response.status === 204) {
        setTeams(teams.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  return (
    <div>
      <h1>Team Management</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {teams.map(team => (
            <div key={team.id}>
              <h2>{team.name}</h2>
              <p>{team.description}</p>
              <p>Members: {team.members?.length || 0}</p>
              <button onClick={() => deleteTeam(team.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## **HTTP Status Codes Summary**

| Status Code | Meaning        | When Used                        |
| ----------- | -------------- | -------------------------------- |
| 200         | OK             | GET, PUT successful              |
| 201         | Created        | POST successful                  |
| 204         | No Content     | DELETE successful                |
| 400         | Bad Request    | Invalid input, validation errors |
| 404         | Not Found      | Team không tồn tại               |
| 500         | Internal Error | Server error, database error     |

---

## **Related Models**

Teams có relationship với:

- **Tournament**: Many-to-One
- **TeamMember**: One-to-Many
- **Entry**: One-to-Many (team đăng ký tham gia các contents)

```typescript
// Team với Tournament
team.tournament → Tournament

// Team với Members
team.members → TeamMember[]

// Team với Entries
team.entries → Entry[]
```

---

## **Testing with cURL**

```bash
# Create team
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -d '{"tournamentId":1,"name":"Team Alpha","description":"Elite team"}'

# Get all teams
curl http://localhost:3000/api/teams

# Get team by ID
curl http://localhost:3000/api/teams/1

# Get teams by tournament
curl http://localhost:3000/api/teams/tournament/1

# Update team
curl -X PUT http://localhost:3000/api/teams/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Team Alpha Elite"}'

# Delete team
curl -X DELETE http://localhost:3000/api/teams/1
```

---

**Last Updated**: January 18, 2026  
**API Version**: 1.0.0
