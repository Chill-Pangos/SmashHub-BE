# 📘 API Documentation - Team Member Operations

Tài liệu này mô tả các API để **quản lý team members** (thành viên đội) trong tournaments.

---

## **Table of Contents**

1. [Create Team Member](#1-create-team-member)
2. [Get All Team Members](#2-get-all-team-members)
3. [Get Team Member by ID](#3-get-team-member-by-id)
4. [Get Members by Team ID](#4-get-members-by-team-id)
5. [Get Teams by User ID](#5-get-teams-by-user-id)
6. [Update Team Member](#6-update-team-member)
7. [Delete Team Member](#7-delete-team-member)

---

## **1. Create Team Member**

### **Endpoint**

```
POST /api/team-members
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication + team manager authorization)

### **Description**

Thêm một member mới vào team. Member có thể có vai trò là team manager, coach, hoặc athlete.

### **Request Body**

#### **TypeScript Interface**

```typescript
interface CreateTeamMemberDto {
  teamId: number; // Required - ID của team
  userId: number; // Required - ID của user
  role: "team_manager" | "coach" | "athlete"; // Required - Vai trò trong team
}
```

#### **Field Descriptions**

| Field    | Type    | Required | Description                                      |
| -------- | ------- | -------- | ------------------------------------------------ |
| `teamId` | integer | ✅ Yes   | ID của team                                      |
| `userId` | integer | ✅ Yes   | ID của user được thêm vào team                   |
| `role`   | enum    | ✅ Yes   | Vai trò: `team_manager`, `coach`, hoặc `athlete` |

### **Role Types**

| Role           | Description     | Typical Permissions                               |
| -------------- | --------------- | ------------------------------------------------- |
| `team_manager` | Quản lý team    | Đăng ký entry, thêm/xóa members, update team info |
| `coach`        | Huấn luyện viên | Xem thông tin, tư vấn chiến thuật                 |
| `athlete`      | Vận động viên   | Tham gia thi đấu                                  |

### **Request Examples**

#### **Example 1: Add team manager**

```json
{
  "teamId": 1,
  "userId": 5,
  "role": "team_manager"
}
```

#### **Example 2: Add athlete**

```json
{
  "teamId": 1,
  "userId": 10,
  "role": "athlete"
}
```

#### **Example 3: Add coach**

```json
{
  "teamId": 1,
  "userId": 15,
  "role": "coach"
}
```

### **Response - 201 Created**

```json
{
  "id": 1,
  "teamId": 1,
  "userId": 5,
  "role": "team_manager",
  "createdAt": "2026-01-18T10:30:00.000Z",
  "updatedAt": "2026-01-18T10:30:00.000Z"
}
```

### **Business Rules**

1. **Team Manager Requirement**
   - Mỗi team phải có ít nhất 1 `team_manager`
   - Không nên xóa member cuối cùng có role `team_manager`

2. **Duplicate Prevention**
   - Một user không thể là member của cùng một team nhiều lần
   - Database constraint sẽ prevent duplicate (teamId, userId)

3. **Role Assignment**
   - Một user có thể là member của nhiều teams khác nhau
   - Một user có thể có role khác nhau ở các teams khác nhau

### **Error Responses**

#### **400 Bad Request** - Invalid input data

```json
{
  "message": "Error creating team member",
  "error": {
    "name": "ValidationError",
    "message": "role must be one of: team_manager, coach, athlete"
  }
}
```

#### **400 Bad Request** - Duplicate member

```json
{
  "message": "Error creating team member",
  "error": {
    "name": "SequelizeUniqueConstraintError",
    "message": "User is already a member of this team"
  }
}
```

#### **404 Not Found** - Team or User doesn't exist

```json
{
  "message": "Error creating team member",
  "error": {
    "name": "SequelizeForeignKeyConstraintError",
    "message": "Team or User not found"
  }
}
```

---

## **2. Get All Team Members**

### **Endpoint**

```
GET /api/team-members
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tất cả team members với pagination.

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/team-members?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
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
  },
  {
    "id": 3,
    "teamId": 2,
    "userId": 15,
    "role": "coach",
    "createdAt": "2026-01-16T11:00:00.000Z",
    "updatedAt": "2026-01-16T11:00:00.000Z"
  }
]
```

### **Response Structure**

Each team member includes:

| Field       | Type    | Description                          |
| ----------- | ------- | ------------------------------------ |
| `id`        | integer | Unique team member ID                |
| `teamId`    | integer | ID của team                          |
| `userId`    | integer | ID của user                          |
| `role`      | string  | Vai trò (team_manager/coach/athlete) |
| `createdAt` | string  | ISO 8601 timestamp khi tạo           |
| `updatedAt` | string  | ISO 8601 timestamp khi cập nhật cuối |

### **Error Responses**

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching team members",
  "error": {}
}
```

---

## **3. Get Team Member by ID**

### **Endpoint**

```
GET /api/team-members/{id}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin chi tiết của một team member theo ID.

### **Path Parameters**

| Parameter | Type    | Required | Description                |
| --------- | ------- | -------- | -------------------------- |
| `id`      | integer | ✅ Yes   | ID của team member cần lấy |

### **Request Example**

```http
GET /api/team-members/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "teamId": 1,
  "userId": 5,
  "role": "team_manager",
  "createdAt": "2026-01-16T10:30:00.000Z",
  "updatedAt": "2026-01-16T10:30:00.000Z"
}
```

### **Error Responses**

#### **404 Not Found** - Team member không tồn tại

```json
{
  "message": "Team member not found"
}
```

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching team member",
  "error": {}
}
```

---

## **4. Get Members by Team ID**

### **Endpoint**

```
GET /api/team-members/team/{teamId}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy tất cả members của một team cụ thể.

### **Path Parameters**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `teamId`  | integer | ✅ Yes   | ID của team cần lấy |

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/team-members/team/1?skip=0&limit=50
```

### **Response - 200 OK**

```json
[
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
```

### **Use Cases**

- Hiển thị roster của team
- Kiểm tra xem user có phải member của team không
- Đếm số lượng athletes/coaches trong team
- Xác định team manager để authorize actions

### **Error Responses**

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching team members",
  "error": {}
}
```

---

## **5. Get Teams by User ID**

### **Endpoint**

```
GET /api/team-members/user/{userId}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy tất cả teams mà một user đang là member.

### **Path Parameters**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `userId`  | integer | ✅ Yes   | ID của user cần lấy |

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/team-members/user/5?skip=0&limit=50
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "teamId": 1,
    "userId": 5,
    "role": "team_manager",
    "createdAt": "2026-01-16T10:30:00.000Z",
    "updatedAt": "2026-01-16T10:30:00.000Z"
  },
  {
    "id": 8,
    "teamId": 3,
    "userId": 5,
    "role": "athlete",
    "createdAt": "2026-01-17T14:00:00.000Z",
    "updatedAt": "2026-01-17T14:00:00.000Z"
  }
]
```

### **Use Cases**

- Hiển thị "My Teams" cho user
- Kiểm tra xem user có thể tham gia thêm team mới không
- Xác định role của user trong các teams khác nhau
- Filter tournaments mà user đang tham gia qua teams

### **Error Responses**

#### **500 Internal Server Error**

```json
{
  "message": "Error fetching team members",
  "error": {}
}
```

---

## **6. Update Team Member**

### **Endpoint**

```
PUT /api/team-members/{id}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication + team manager authorization)

### **Description**

Cập nhật role của team member.

> 💡 **Use Case:** Thường dùng để promote athlete lên team_manager hoặc thay đổi role

### **Path Parameters**

| Parameter | Type    | Required | Description                   |
| --------- | ------- | -------- | ----------------------------- |
| `id`      | integer | ✅ Yes   | ID của team member cần update |

### **Request Body**

#### **TypeScript Interface**

```typescript
interface UpdateTeamMemberDto {
  role: "team_manager" | "coach" | "athlete"; // Required - Role mới
}
```

#### **Field Descriptions**

| Field  | Type | Required | Description                                       |
| ------ | ---- | -------- | ------------------------------------------------- |
| `role` | enum | ✅ Yes   | Role mới: `team_manager`, `coach`, hoặc `athlete` |

### **Request Example**

```json
{
  "role": "team_manager"
}
```

### **Response - 200 OK**

```json
[
  1,
  [
    {
      "id": 2,
      "teamId": 1,
      "userId": 10,
      "role": "team_manager",
      "createdAt": "2026-01-16T10:35:00.000Z",
      "updatedAt": "2026-01-18T15:00:00.000Z"
    }
  ]
]
```

> 📝 **Response Format:** Sequelize trả về array với:
>
> - `[0]`: Số lượng rows được update (1)
> - `[1]`: Array chứa team member object đã update

### **Common Scenarios**

1. **Promote athlete to manager**

   ```json
   { "role": "team_manager" }
   ```

2. **Assign coach role**

   ```json
   { "role": "coach" }
   ```

3. **Change manager back to athlete**
   ```json
   { "role": "athlete" }
   ```

### **Error Responses**

#### **404 Not Found** - Team member không tồn tại

```json
{
  "message": "Team member not found"
}
```

#### **400 Bad Request** - Invalid role

```json
{
  "message": "Error updating team member",
  "error": {
    "name": "ValidationError",
    "message": "role must be one of: team_manager, coach, athlete"
  }
}
```

---

## **7. Delete Team Member**

### **Endpoint**

```
DELETE /api/team-members/{id}
```

### **Authentication**

❌ **Not Required** (Nên thêm authentication + team manager authorization)

### **Description**

Xóa một member khỏi team.

> ⚠️ **Cảnh báo:**
>
> - Không nên xóa member cuối cùng có role `team_manager`
> - Xóa member có thể ảnh hưởng đến entries đã đăng ký

### **Path Parameters**

| Parameter | Type    | Required | Description                |
| --------- | ------- | -------- | -------------------------- |
| `id`      | integer | ✅ Yes   | ID của team member cần xóa |

### **Request Example**

```http
DELETE /api/team-members/5
```

### **Response - 204 No Content**

Không có response body. HTTP status 204 nghĩa là đã xóa thành công.

### **Error Responses**

#### **404 Not Found** - Team member không tồn tại

```json
{
  "message": "Team member not found"
}
```

#### **500 Internal Server Error** - Cascade constraint

```json
{
  "message": "Error deleting team member",
  "error": {
    "name": "SequelizeForeignKeyConstraintError",
    "message": "Cannot delete member with active entries"
  }
}
```

---

## **TypeScript Interfaces Summary**

### **TeamMember Model**

```typescript
interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: "team_manager" | "coach" | "athlete";
  createdAt: Date;
  updatedAt: Date;
  // Relations
  team?: Team;
  user?: User;
}
```

### **DTOs**

```typescript
// Create Team Member
interface CreateTeamMemberDto {
  teamId: number;
  userId: number;
  role: "team_manager" | "coach" | "athlete";
}

// Update Team Member
interface UpdateTeamMemberDto {
  role: "team_manager" | "coach" | "athlete";
}

// Response
interface TeamMemberResponseDto {
  id: number;
  teamId: number;
  userId: number;
  role: "team_manager" | "coach" | "athlete";
  createdAt: Date;
  updatedAt: Date;
}
```

---

## **Common Use Cases**

### **Use Case 1: Build a team from scratch**

```typescript
async function buildTeam(
  tournamentId: number,
  teamName: string,
  managerId: number,
  athleteIds: number[],
) {
  // Step 1: Create team
  const teamResponse = await fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tournamentId,
      name: teamName,
      description: "New competitive team",
    }),
  });
  const team = await teamResponse.json();

  // Step 2: Add team manager
  await fetch("/api/team-members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamId: team.id,
      userId: managerId,
      role: "team_manager",
    }),
  });

  // Step 3: Add athletes
  for (const athleteId of athleteIds) {
    await fetch("/api/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: team.id,
        userId: athleteId,
        role: "athlete",
      }),
    });
  }

  return team;
}
```

### **Use Case 2: Check if user is team manager**

```typescript
async function isTeamManager(userId: number, teamId: number): Promise<boolean> {
  const response = await fetch(`/api/team-members/team/${teamId}`);
  const members = await response.json();

  const member = members.find(
    (m: TeamMember) => m.userId === userId && m.role === "team_manager",
  );

  return !!member;
}
```

### **Use Case 3: Get user's teams with role information**

```typescript
async function getUserTeamsWithInfo(userId: number) {
  const response = await fetch(`/api/team-members/user/${userId}`);
  const memberships = await response.json();

  // Group by role
  const teamsGrouped = {
    managing: memberships.filter((m: TeamMember) => m.role === "team_manager"),
    coaching: memberships.filter((m: TeamMember) => m.role === "coach"),
    playing: memberships.filter((m: TeamMember) => m.role === "athlete"),
  };

  return teamsGrouped;
}
```

### **Use Case 4: Update member role (promote athlete)**

```typescript
async function promoteToManager(memberId: number, token: string) {
  try {
    const response = await fetch(`/api/team-members/${memberId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "team_manager" }),
    });

    if (!response.ok) {
      throw new Error("Failed to promote member");
    }

    return await response.json();
  } catch (error) {
    console.error("Promotion failed:", error);
    throw error;
  }
}
```

---

## **Frontend Implementation Example (React)**

```typescript
import { useState, useEffect } from 'react';

interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: 'team_manager' | 'coach' | 'athlete';
  createdAt: string;
  updatedAt: string;
}

function TeamRoster({ teamId }: { teamId: number }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch team members
  useEffect(() => {
    fetchTeamMembers();
  }, [teamId]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/team-members/team/${teamId}`);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new member
  const addMember = async (userId: number, role: string) => {
    try {
      const response = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId, role })
      });

      if (response.status === 201) {
        await fetchTeamMembers(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/team-members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        await fetchTeamMembers();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  // Remove member
  const removeMember = async (memberId: number) => {
    try {
      const response = await fetch(`/api/team-members/${memberId}`, {
        method: 'DELETE'
      });

      if (response.status === 204) {
        setMembers(members.filter(m => m.id !== memberId));
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  // Group members by role
  const groupedMembers = {
    managers: members.filter(m => m.role === 'team_manager'),
    coaches: members.filter(m => m.role === 'coach'),
    athletes: members.filter(m => m.role === 'athlete')
  };

  return (
    <div>
      <h2>Team Roster</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <div>
            <h3>Team Managers ({groupedMembers.managers.length})</h3>
            {groupedMembers.managers.map(member => (
              <div key={member.id}>
                User ID: {member.userId}
                <button onClick={() => removeMember(member.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div>
            <h3>Coaches ({groupedMembers.coaches.length})</h3>
            {groupedMembers.coaches.map(member => (
              <div key={member.id}>
                User ID: {member.userId}
                <button onClick={() => updateMemberRole(member.id, 'team_manager')}>
                  Promote to Manager
                </button>
                <button onClick={() => removeMember(member.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div>
            <h3>Athletes ({groupedMembers.athletes.length})</h3>
            {groupedMembers.athletes.map(member => (
              <div key={member.id}>
                User ID: {member.userId}
                <button onClick={() => updateMemberRole(member.id, 'coach')}>
                  Make Coach
                </button>
                <button onClick={() => removeMember(member.id)}>Remove</button>
              </div>
            ))}
          </div>
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
| 404         | Not Found      | Team member không tồn tại        |
| 500         | Internal Error | Server error, database error     |

---

## **Related Models**

TeamMember có relationship với:

- **Team**: Many-to-One
- **User**: Many-to-One

```typescript
// TeamMember với Team
teamMember.team → Team

// TeamMember với User
teamMember.user → User
```

---

## **Business Logic & Validation**

### **Validation Rules**

1. **Required Fields**
   - `teamId`, `userId`, `role` đều bắt buộc khi create

2. **Role Validation**
   - Role phải là một trong: `team_manager`, `coach`, `athlete`
   - Invalid role sẽ return 400 Bad Request

3. **Unique Constraint**
   - Một user không thể là member của cùng một team nhiều lần
   - Database enforces unique constraint trên (teamId, userId)

4. **Foreign Key Validation**
   - `teamId` phải tồn tại trong bảng Teams
   - `userId` phải tồn tại trong bảng Users

### **Recommended Business Rules (Frontend Implementation)**

1. **Team Manager Requirement**
   - Không cho phép xóa member cuối cùng có role `team_manager`
   - Hiển thị warning khi attempting to remove last manager

2. **Role Change Authorization**
   - Chỉ team managers mới có thể thay đổi roles của members khác
   - Frontend nên check authorization trước khi gọi API

3. **Member Limit**
   - Có thể giới hạn số lượng members tối đa per team
   - Validate trước khi gọi create API

---

## **Testing with cURL**

```bash
# Create team member (team manager)
curl -X POST http://localhost:3000/api/team-members \
  -H "Content-Type: application/json" \
  -d '{"teamId":1,"userId":5,"role":"team_manager"}'

# Create team member (athlete)
curl -X POST http://localhost:3000/api/team-members \
  -H "Content-Type: application/json" \
  -d '{"teamId":1,"userId":10,"role":"athlete"}'

# Get all team members
curl http://localhost:3000/api/team-members

# Get team member by ID
curl http://localhost:3000/api/team-members/1

# Get members by team
curl http://localhost:3000/api/team-members/team/1

# Get teams by user
curl http://localhost:3000/api/team-members/user/5

# Update member role
curl -X PUT http://localhost:3000/api/team-members/2 \
  -H "Content-Type: application/json" \
  -d '{"role":"team_manager"}'

# Delete team member
curl -X DELETE http://localhost:3000/api/team-members/3
```

---

## **Security Considerations**

### **Recommended Authentication & Authorization**

1. **Create Team Member** (POST)
   - ✅ Require authentication
   - ✅ Only team managers can add members
   - Validate user has `team_manager` role for the specific team

2. **Update Member Role** (PUT)
   - ✅ Require authentication
   - ✅ Only team managers can update roles
   - Prevent demoting yourself if you're the last manager

3. **Delete Member** (DELETE)
   - ✅ Require authentication
   - ✅ Only team managers can remove members
   - Prevent removing yourself if you're the last manager

### **Example Authorization Check**

```typescript
// Middleware to check if user is team manager
async function isTeamManagerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { teamId } = req.body;
  const userId = req.user.id; // From JWT token

  const members = await TeamMember.findAll({
    where: { teamId, userId, role: "team_manager" },
  });

  if (members.length === 0) {
    return res
      .status(403)
      .json({ message: "Only team managers can perform this action" });
  }

  next();
}
```

---

**Last Updated**: January 18, 2026  
**API Version**: 1.0.0
