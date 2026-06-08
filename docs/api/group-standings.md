# Group Standings

Group stage standings endpoints

Total endpoints: 7

## POST /api/group-standings/generate-placeholders
Tag: Group Standings
Summary: Generate group placeholders

Tạo danh sách bảng đấu placeholder cho tournament category.
Số lượng bảng phải là lũy thừa của 2 (4, 8, 16, 32, 64) và tối thiểu là 4.
Mỗi bảng có 3-5 đội.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
Example payload:
```json
{
  "categoryId": 1
}
```

Responses:
### 200
Placeholders generated successfully

### 400
Description: Bad request
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

---

## POST /api/group-standings/random-draw
Tag: Group Standings
Summary: Random draw preview (alias)

Alias của endpoint generate-placeholders.
Trả về preview phân bảng ngẫu nhiên (chưa lưu DB).

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
Example payload:
```json
{
  "categoryId": 1
}
```

Responses:
### 200
Random draw completed successfully

### 400
Description: Bad request
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

---

## POST /api/group-standings/save-assignments
Tag: Group Standings
Summary: Save group assignments

Lưu kết quả phân bổ entries vào các bảng đấu vào database

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
  - groupAssignments: array | Preferred field for assignments
    - items: object
      - groupName: string
      - entryIds: array
        - items: integer
  - assignments: array | Backward-compatible alias of groupAssignments
    - items: object
      - groupName: string
      - entryIds: array
        - items: integer
Example payload:
```json
{
  "categoryId": 1,
  "groupAssignments": [
    {
      "groupName": "Group A",
      "entryIds": [
        1,
        2,
        3,
        4
      ]
    }
  ],
  "assignments": [
    {
      "groupName": "Group A",
      "entryIds": [
        1,
        2,
        3,
        4
      ]
    }
  ]
}
```

Responses:
### 201
Assignments saved successfully

### 400
Description: Bad request
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

---

## POST /api/group-standings/calculate
Tag: Group Standings
Summary: Recalculate group standings positions

Recalculate ranking positions from existing standings stats.
Current tie-breaker order in service:
1. matchesWon (desc)
2. setsDiff (desc)
3. head-to-head result
Nếu không truyền groupName sẽ tính lại cho tất cả bảng trong category.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
  - groupName: string | Calculate for specific group (optional, all groups if not provided)
Example payload:
```json
{
  "categoryId": 1,
  "groupName": "Group A"
}
```

Responses:
### 200
Standings calculated successfully

### 400
Description: Bad request
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

---

## POST /api/group-standings/matches/{matchId}/sync
Tag: Group Standings
Summary: Sync standings after a completed group match

Cập nhật thống kê và thứ hạng của 2 entry trong bảng sau khi trận đấu group stage hoàn tất.
Chỉ chief referee của tournament được phép thực hiện.

Auth: bearerAuth

Request parameters:
- matchId (path) | type: integer | required | Match ID

Request body:
None

Responses:
### 200
Standings synced successfully

### 400
Description: Bad request
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

---

## GET /api/group-standings/{categoryId}
Tag: Group Standings
Summary: Get group standings

Retrieve current standings for all groups or a specific group

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID
- groupName (query) | type: string | Filter by specific group name

Request body:
None

Responses:
### 200
Standings retrieved successfully

### 500

---

## GET /api/group-standings/{categoryId}/qualified
Tag: Group Standings
Summary: Get qualified teams from group stage

Returns top N teams from each group based on standings

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID
- teamsPerGroup (query) | type: integer | Legacy alias of qualifiersPerGroup | default: 2
- qualifiersPerGroup (query) | type: integer | Number of teams to qualify from each group | default: 2

Request body:
None

Responses:
### 200
Qualified teams retrieved successfully

### 500

---
