# 📘 API Documentation - Group Standing Operations

Tài liệu này mô tả các API để **quản lý group standings (bảng xếp hạng vòng bảng)** trong tournaments.

> 📝 **Lưu ý quan trọng:**
>
> - Group Standing dùng cho **vòng đấu bảng** (round-robin)
> - Hỗ trợ **bốc thăm ngẫu nhiên** (random draw) phân bổ entries vào các bảng
> - Tự động **tính toán xếp hạng** dựa trên kết quả matches
> - Xác định **teams/entries qualified** để lên vòng knockout

---

## **Table of Contents**

1. [Generate Group Placeholders](#1-generate-group-placeholders)
2. [Random Draw Entries](#2-random-draw-entries)
3. [Save Group Assignments](#3-save-group-assignments)
4. [Random Draw and Save](#4-random-draw-and-save)
5. [Calculate Group Standings](#5-calculate-group-standings)
6. [Get Group Standings by Content ID](#6-get-group-standings-by-content-id)
7. [Get Qualified Teams](#7-get-qualified-teams)

---

## **1. Generate Group Placeholders**

### **Endpoint**

```
POST /api/group-standings/generate-placeholders
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Tạo danh sách **placeholder group standings** dựa trên tournament content configuration.

**Khi nào sử dụng:**

- Bước đầu tiên khi setup vòng bảng
- Tạo các "ô trống" chờ entries được phân bổ vào
- Tính toán số bảng và số slots mỗi bảng

**Workflow:**

1. Generate placeholders (API này)
2. Random draw hoặc manual assign entries
3. Save assignments
4. Generate schedule
5. Play matches
6. Calculate standings

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

### **Response - 200 OK**

**Scenario: 12 entries đăng ký, chia 4 bảng**

```json
{
  "success": true,
  "data": {
    "numGroups": 4,
    "teamsPerGroup": [3, 3, 3, 3],
    "totalSlots": 12,
    "groups": [
      {
        "groupName": "Bảng A",
        "slots": 3,
        "entries": [],
        "description": "3 slots available"
      },
      {
        "groupName": "Bảng B",
        "slots": 3,
        "entries": [],
        "description": "3 slots available"
      },
      {
        "groupName": "Bảng C",
        "slots": 3,
        "entries": [],
        "description": "3 slots available"
      },
      {
        "groupName": "Bảng D",
        "slots": 3,
        "entries": [],
        "description": "3 slots available"
      }
    ]
  },
  "message": "Danh sách bảng đấu đã được tạo thành công"
}
```

**Logic tính số bảng:**

- 4-8 entries: 2 groups
- 9-16 entries: 4 groups
- 17-24 entries: 6 groups
- 25-32 entries: 8 groups

### **Error Responses**

```json
{
  "success": false,
  "message": "Không có entries nào đăng ký cho tournament content này"
}
```

---

## **2. Random Draw Entries**

### **Endpoint**

```
POST /api/group-standings/random-draw
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

**Bốc thăm ngẫu nhiên** phân bổ entries vào các bảng (chưa lưu vào database).

**Use case:**

- Preview kết quả bốc thăm trước khi xác nhận
- Cho phép re-draw nếu không hài lòng
- Frontend hiển thị kết quả để user review

**Workflow:**

1. Random draw (API này) - preview
2. Nếu OK → Save assignments
3. Nếu không OK → Random draw lại

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

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "groupName": "Bảng A",
        "entryIds": [5, 12, 18]
      },
      {
        "groupName": "Bảng B",
        "entryIds": [3, 9, 15]
      },
      {
        "groupName": "Bảng C",
        "entryIds": [7, 11, 20]
      },
      {
        "groupName": "Bảng D",
        "entryIds": [2, 8, 14]
      }
    ],
    "totalEntries": 12
  },
  "message": "Bốc thăm thành công"
}
```

**Lưu ý:**

- Kết quả chưa được lưu vào database
- Mỗi lần gọi API sẽ ra kết quả khác (random)
- Cần gọi `save-assignments` để lưu

### **Error Responses**

```json
{
  "success": false,
  "message": "Không tìm thấy entries cho tournament content này"
}
```

---

## **3. Save Group Assignments**

### **Endpoint**

```
POST /api/group-standings/save-assignments
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Lưu kết quả phân bổ entries vào các bảng vào database.

**Use case:**

- Sau khi random draw và user xác nhận
- Manual assignment (tự chia bảng)
- Re-assignment (chia lại)

### **Request Body**

| Field              | Type    | Required | Description               | Example   |
| ------------------ | ------- | -------- | ------------------------- | --------- |
| `contentId`        | integer | Yes      | Tournament Content ID     | `1`       |
| `groupAssignments` | array   | Yes      | Danh sách bảng và entries | See below |

**Structure của `groupAssignments`:**

```typescript
groupAssignments: [
  {
    groupName: string;    // "Bảng A"
    entryIds: number[];   // [5, 12, 18]
  }
]
```

### **Request Example**

```json
{
  "contentId": 1,
  "groupAssignments": [
    {
      "groupName": "Bảng A",
      "entryIds": [5, 12, 18]
    },
    {
      "groupName": "Bảng B",
      "entryIds": [3, 9, 15]
    },
    {
      "groupName": "Bảng C",
      "entryIds": [7, 11, 20]
    },
    {
      "groupName": "Bảng D",
      "entryIds": [2, 8, 14]
    }
  ]
}
```

### **Response - 201 Created**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contentId": 1,
      "groupName": "Bảng A",
      "entryId": 5,
      "matchesPlayed": 0,
      "matchesWon": 0,
      "matchesLost": 0,
      "setsWon": 0,
      "setsLost": 0,
      "setsDiff": 0,
      "position": null
    },
    {
      "id": 2,
      "contentId": 1,
      "groupName": "Bảng A",
      "entryId": 12,
      "matchesPlayed": 0,
      "matchesWon": 0,
      "matchesLost": 0,
      "setsWon": 0,
      "setsLost": 0,
      "setsDiff": 0,
      "position": null
    }
    // ... more entries
  ],
  "message": "Lưu phân bổ bảng đấu thành công"
}
```

### **Error Responses**

```json
{
  "success": false,
  "message": "Invalid group assignments data"
}
```

---

## **4. Random Draw and Save**

### **Endpoint**

```
POST /api/group-standings/random-draw-and-save
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

**Bốc thăm ngẫu nhiên VÀ lưu luôn** vào database (one-step operation).

**Khi nào sử dụng:**

- Muốn bốc thăm và xác nhận luôn (không cần preview)
- Automated setup
- Quick tournament setup

**So sánh với workflow 2 bước:**

- 2 steps: `random-draw` → review → `save-assignments`
- 1 step: `random-draw-and-save` (API này)

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

```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "groupName": "Bảng A",
        "standings": [
          {
            "id": 1,
            "contentId": 1,
            "groupName": "Bảng A",
            "entryId": 5,
            "matchesPlayed": 0,
            "matchesWon": 0,
            "matchesLost": 0,
            "setsWon": 0,
            "setsLost": 0,
            "setsDiff": 0,
            "position": null
          },
          {
            "id": 2,
            "contentId": 1,
            "groupName": "Bảng A",
            "entryId": 12,
            "matchesPlayed": 0,
            "matchesWon": 0,
            "matchesLost": 0,
            "setsWon": 0,
            "setsLost": 0,
            "setsDiff": 0,
            "position": null
          }
        ]
      },
      {
        "groupName": "Bảng B",
        "standings": [
          // ... more entries
        ]
      }
    ],
    "totalCreated": 12
  },
  "message": "Bốc thăm và lưu thành công"
}
```

### **Error Responses**

```json
{
  "success": false,
  "message": "Không thể bốc thăm và lưu: không đủ entries"
}
```

---

## **5. Calculate Group Standings**

### **Endpoint**

```
POST /api/group-standings/calculate
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Tính toán **xếp hạng bảng đấu** dựa trên kết quả matches đã hoàn thành trong vòng bảng.

**Tính năng:**
- ✅ Tính tất cả bảng nếu chỉ truyền `contentId`
- ✅ Tính một bảng cụ thể nếu truyền thêm `groupName`
- ✅ Auto update `position`, `matchesPlayed`, `matchesWon`, `matchesLost`, `setsWon`, `setsLost`, `setsDiff`

**Khi nào sử dụng:**
- Sau khi các trận đấu vòng bảng kết thúc
- Muốn cập nhật xếp hạng theo real-time
- Recalculate khi có sửa đổi match results

**Ranking logic (Quy tắc ưu tiên):**
1. **Match points** - Win = 3, Draw = 1, Loss = 0 (cao hơn = xếp trên)
2. **Head-to-head** - Kết quả đối đầu trực tiếp (nếu hòa điểm)
3. **Games (sets) difference** - Hiệu số sets (setsWon - setsLost)
4. **Games won** - Tổng số sets thắng
5. **Points difference** - Hiệu số điểm
6. **Points won** - Tổng điểm ghi được
7. **Random draw** - Bốc thăm nếu vẫn hòa

### **Request Body**

| Field       | Type    | Required | Description                                          | Example    |
| ----------- | ------- | -------- | ---------------------------------------------------- | ---------- |
| `contentId` | integer | Yes      | Tournament Content ID                                | `1`        |
| `groupName` | string  | No       | Tính cho bảng cụ thể (không truyền = tính tất cả bảng) | `"Group A"` |

### **Request Example**

**Tính tất cả bảng (Recommended):**

```json
{
  "contentId": 1
}
```

**Tính một bảng cụ thể:**

```json
{
  "contentId": 1,
  "groupName": "Group A"
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "contentId": 1,
      "groupName": "Bảng A",
      "entryId": 8,
      "matchesPlayed": 3,
      "matchesWon": 3,
      "matchesLost": 0,
      "setsWon": 6,
      "setsLost": 1,
      "setsDiff": 5,
      "position": 1,
      "entry": {
        "id": 8,
        "team": {
          "name": "Team Alpha"
        }
      }
    },
    {
      "id": 1,
      "contentId": 1,
      "groupName": "Bảng A",
      "entryId": 5,
      "matchesPlayed": 3,
      "matchesWon": 2,
      "matchesLost": 1,
      "setsWon": 5,
      "setsLost": 3,
      "setsDiff": 2,
      "position": 2,
      "entry": {
        "id": 5,
        "team": {
          "name": "Team Beta"
        }
      }
    },
    {
      "id": 3,
      "contentId": 1,
      "groupName": "Bảng A",
      "entryId": 11,
      "matchesPlayed": 3,
      "matchesWon": 1,
      "matchesLost": 2,
      "setsWon": 3,
      "setsLost": 5,
      "setsDiff": -2,
      "position": 3,
      "entry": {
        "id": 11,
        "team": {
          "name": "Team Gamma"
        }
      }
    },
    {
      "id": 4,
      "contentId": 1,
      "groupName": "Bảng A",
      "entryId": 14,
      "matchesPlayed": 3,
      "matchesWon": 0,
      "matchesLost": 3,
      "setsWon": 1,
      "setsLost": 6,
      "setsDiff": -5,
      "position": 4,
      "entry": {
        "id": 14,
        "team": {
          "name": "Team Delta"
        }
      }
    }
  ],
  "message": "Đã tính toán standings thành công"
}
```

**Giải thích xếp hạng:**

- Position 1: 3 wins, +5 set diff
- Position 2: 2 wins, +2 set diff
- Position 3: 1 win, -2 set diff
- Position 4: 0 wins, -5 set diff

### **Error Responses**

```json
{
  "success": false,
  "message": "Không tìm thấy group standings để tính toán"
}
```

---

## **6. Get Group Standings by Content ID**

### **Endpoint**

```
GET /api/group-standings/{contentId}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy tất cả group standings của một tournament content, **được sắp xếp theo bảng và position**.

**Use case chính:**
- Hiển thị toàn bộ bảng xếp hạng vòng bảng
- Xem standings của tất cả các bảng (A, B, C...)
- Lọc theo groupName nếu cần

### **Path Parameters**

| Parameter   | Type    | Required | Description           |
| ----------- | ------- | -------- | --------------------- |
| `contentId` | integer | Yes      | Tournament Content ID |

### **Query Parameters**

| Parameter   | Type   | Required | Description                        |
| ----------- | ------ | -------- | ---------------------------------- |
| `groupName` | string | No       | Filter by specific group name      |

### **Request Example**

```http
GET /api/group-standings/1?groupName=Group%20A
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "contentId": 1,
      "groupName": "Group A",
      "entryId": 8,
      "matchesPlayed": 3,
      "matchesWon": 3,
      "matchesLost": 0,
      "setsWon": 6,
      "setsLost": 1,
      "setsDiff": 5,
      "position": 1,
      "entry": {
        "id": 8,
        "team": {
          "id": 3,
          "name": "Team Alpha"
        }
      }
    },
    {
      "id": 1,
      "contentId": 1,
      "groupName": "Group A",
      "entryId": 5,
      "matchesPlayed": 3,
      "matchesWon": 2,
      "matchesLost": 1,
      "setsWon": 5,
      "setsLost": 3,
      "setsDiff": 2,
      "position": 2,
      "entry": {
        "id": 5,
        "team": {
          "id": 2,
          "name": "Team Beta"
        }
      }
    }
  ]
}
```

### **Error Responses**

```json
{
  "success": false,
  "message": "Group standings not found"
}
```

---

## **7. Get Qualified Teams**

### **Endpoint**

```
GET /api/group-standings/{contentId}/qualified
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách các teams/entries **qualified** để lên vòng knockout.

**Logic:**

- Thường lấy top N teams mỗi bảng
- Ví dụ: top 2 mỗi bảng → 4 bảng = 8 teams vào knockout
- Sắp xếp theo position

### **Path Parameters**

| Parameter   | Type    | Required | Description           |
| ----------- | ------- | -------- | --------------------- |
| `contentId` | integer | Yes      | Tournament Content ID |

### **Query Parameters**

| Parameter       | Type    | Required | Default | Description                 |
| --------------- | ------- | -------- | ------- | --------------------------- |
| `teamsPerGroup` | integer | No       | `2`     | Số teams qualified mỗi bảng |

### **Request Example**

```http
GET /api/group-standings/1/qualified?teamsPerGroup=2
```

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "qualifiedEntries": [
      {
        "groupName": "Bảng A",
        "position": 1,
        "entryId": 8,
        "entry": {
          "id": 8,
          "team": {
            "name": "Team Alpha"
          }
        }
      },
      {
        "groupName": "Bảng A",
        "position": 2,
        "entryId": 5,
        "entry": {
          "id": 5,
          "team": {
            "name": "Team Beta"
          }
        }
      },
      {
        "groupName": "Bảng B",
        "position": 1,
        "entryId": 12,
        "entry": {
          "id": 12,
          "team": {
            "name": "Team Gamma"
          }
        }
      },
      {
        "groupName": "Bảng B",
        "position": 2,
        "entryId": 9,
        "entry": {
          "id": 9,
          "team": {
            "name": "Team Delta"
          }
        }
      }
    ],
    "totalQualified": 8
  }
}
```

---

## **Important Notes cho Frontend**

### **1. Workflow hoàn chỉnh setup vòng bảng**

```javascript
// Step 1: Generate placeholders
const placeholders = await fetch("/api/group-standings/generate-placeholders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ contentId: 1 }),
}).then((r) => r.json());

console.log(placeholders.data.groups);
// [
//   { groupName: "Bảng A", slots: 3, entries: [] },
//   { groupName: "Bảng B", slots: 3, entries: [] },
//   ...
// ]

// Step 2a: Random draw (preview)
const drawResult = await fetch("/api/group-standings/random-draw", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ contentId: 1 }),
}).then((r) => r.json());

// User reviews and confirms

// Step 2b: Save assignments
await fetch("/api/group-standings/save-assignments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    contentId: 1,
    groupAssignments: drawResult.data.groups,
  }),
});

// OR Step 2 (one-step): Random draw and save
await fetch("/api/group-standings/random-draw-and-save", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ contentId: 1 }),
});

// Step 3: Generate schedule (separate API)
await fetch("/api/schedules/generate-complete", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ contentId: 1 }),
});

// Step 4: Sau khi matches kết thúc, calculate standings
await fetch("/api/group-standings/calculate-standings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ contentId: 1 }),
});

// Step 5: Get qualified teams for knockout
const qualified = await fetch(
  "/api/group-standings/qualified/1?teamsPerGroup=2",
).then((r) => r.json());
```

### **2. Display Group Standings Table**

```javascript
const displayGroupStandings = async (contentId) => {
  const response = await fetch(`/api/group-standings/${contentId}`);
  const { data: standings } = await response.json();

  // Group by groupName
  const groups = {};
  standings.forEach((s) => {
    if (!groups[s.groupName]) {
      groups[s.groupName] = [];
    }
    groups[s.groupName].push(s);
  });

  // Display each group
  Object.entries(groups).forEach(([groupName, entries]) => {
    console.log(`\n${groupName}:`);
    console.log("Pos | Team | W | L | Sets | Diff");
    console.log("--- | ---- | - | - | ---- | ----");

    entries
      .sort((a, b) => (a.position || 99) - (b.position || 99))
      .forEach((e) => {
        console.log(
          `${e.position || "-"} | ${e.entry?.team?.name} | ` +
            `${e.matchesWon} | ${e.matchesLost} | ` +
            `${e.setsWon}-${e.setsLost} | ${e.setsDiff > 0 ? "+" : ""}${e.setsDiff}`,
        );
      });
  });
};

// Example output:
// Bảng A:
// Pos | Team | W | L | Sets | Diff
// --- | ---- | - | - | ---- | ----
// 1 | Team Alpha | 3 | 0 | 6-1 | +5
// 2 | Team Beta | 2 | 1 | 5-3 | +2
// 3 | Team Gamma | 1 | 2 | 3-5 | -2
// 4 | Team Delta | 0 | 3 | 1-6 | -5
```

### **3. Auto-calculate standings after match completion**

```javascript
const onMatchCompleted = async (matchId, contentId) => {
  // 1. Update match winner (see Match API docs)
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

  // 2. Recalculate standings
  await fetch("/api/group-standings/calculate-standings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentId }),
  });

  // 3. Refresh standings display
  await displayGroupStandings(contentId);
};
```

### **4. Validation Rules**

- Mỗi entry chỉ thuộc 1 bảng
- Số entries mỗi bảng nên cân bằng (3-3-3-3 hoặc 4-4-3-3)
- Position phải unique trong một bảng
- Standings phải được tính toán từ match results (không manual)

### **5. Best Practices**

✅ **Nên:**

- Generate placeholders trước khi assign
- Preview random draw trước khi save
- Auto-calculate standings sau mỗi match
- Cache standings để hiển thị nhanh
- Sort theo position khi hiển thị

❌ **Không nên:**

- Manual update standings (nên dùng calculate API)
- Skip placeholders step
- Assign entries không đều giữa các bảng
- Hardcode số bảng (dùng calculation logic)

---

## **TypeScript Interfaces**

```typescript
// Group Standing Model
interface GroupStanding {
  id: number;
  contentId: number;
  groupName: string;
  entryId: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  position: number | null;
  createdAt: string;
  updatedAt: string;
  entry?: {
    id: number;
    team: {
      id: number;
      name: string;
    };
  };
}

// Create Request
interface CreateGroupStandingRequest {
  contentId: number;
  groupName: string;
  entryId: number;
}

// Update Request
interface UpdateGroupStandingRequest {
  groupName?: string;
  matchesPlayed?: number;
  matchesWon?: number;
  matchesLost?: number;
  setsWon?: number;
  setsLost?: number;
  setsDiff?: number;
  position?: number;
}

// Generate Placeholders Request
interface GeneratePlaceholdersRequest {
  contentId: number;
}

// Group Placeholder Response
interface GroupPlaceholder {
  groupName: string;
  slots: number;
  entries: any[];
  description: string;
}

interface GeneratePlaceholdersResponse {
  numGroups: number;
  teamsPerGroup: number[];
  totalSlots: number;
  groups: GroupPlaceholder[];
}

// Random Draw Request
interface RandomDrawRequest {
  contentId: number;
}

// Random Draw Response
interface RandomDrawResponse {
  groups: {
    groupName: string;
    entryIds: number[];
  }[];
  totalEntries: number;
}

// Save Assignments Request
interface SaveAssignmentsRequest {
  contentId: number;
  groupAssignments: {
    groupName: string;
    entryIds: number[];
  }[];
}

// Calculate Standings Request
interface CalculateStandingsRequest {
  contentId: number;
  groupName?: string;
}

// Qualified Teams Response
interface QualifiedTeamsResponse {
  qualifiedEntries: {
    groupName: string;
    position: number;
    entryId: number;
    entry: {
      id: number;
      team: {
        name: string;
      };
    };
  }[];
  totalQualified: number;
}
```

---

## **Common Use Cases**

### **Use Case 1: Quick setup with random draw**

```javascript
const quickSetupGroupStage = async (contentId) => {
  try {
    // One-step: random draw and save
    const result = await fetch("/api/group-standings/random-draw-and-save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contentId }),
    }).then((r) => r.json());

    console.log(
      "Setup completed:",
      result.data.totalCreated,
      "entries assigned",
    );

    // Now generate schedule
    await generateSchedule(contentId);

    return result.data;
  } catch (error) {
    console.error("Setup failed:", error);
  }
};
```

### **Use Case 2: Manual assignment with preview**

```javascript
const manualAssignmentWithPreview = async (contentId) => {
  // Step 1: Get placeholders
  const placeholders = await fetch(
    "/api/group-standings/generate-placeholders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contentId }),
    },
  ).then((r) => r.json());

  // Step 2: Random draw (preview mode)
  let satisfied = false;
  let drawResult;

  while (!satisfied) {
    drawResult = await fetch("/api/group-standings/random-draw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contentId }),
    }).then((r) => r.json());

    // Show to user
    console.log("Draw result:", drawResult.data.groups);

    // User can accept or redraw
    satisfied = confirm("Accept this draw?");
  }

  // Step 3: Save the accepted draw
  await fetch("/api/group-standings/save-assignments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contentId,
      groupAssignments: drawResult.data.groups,
    }),
  });

  console.log("Assignments saved!");
};
```

### **Use Case 3: Display live standings during tournament**

```javascript
const displayLiveStandings = async (contentId) => {
  const response = await fetch(`/api/group-standings/${contentId}`);
  const { data: standings } = await response.json();

  // Group by groupName
  const groupedStandings = standings.reduce((acc, s) => {
    if (!acc[s.groupName]) acc[s.groupName] = [];
    acc[s.groupName].push(s);
    return acc;
  }, {});

  // Render each group
  return Object.entries(groupedStandings).map(([groupName, entries]) => ({
    groupName,
    standings: entries.sort((a, b) => (a.position || 99) - (b.position || 99)),
    qualified: entries.filter((e) => e.position && e.position <= 2), // top 2
  }));
};

// Auto-refresh every 30 seconds
setInterval(async () => {
  const standings = await displayLiveStandings(contentId);
  updateUI(standings);
}, 30000);
```

### **Use Case 4: Determine qualified teams for knockout**

```javascript
const setupKnockoutStage = async (contentId, teamsPerGroup = 2) => {
  // Get qualified teams
  const response = await fetch(
    `/api/group-standings/qualified/${contentId}?teamsPerGroup=${teamsPerGroup}`,
  );
  const {
    data: { qualifiedEntries },
  } = await response.json();

  console.log("Qualified teams:", qualifiedEntries.length);

  // Now generate knockout bracket with these teams
  // (See Knockout Bracket API docs)
  const bracketResponse = await fetch("/api/knockout-brackets/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contentId,
      qualifiedEntryIds: qualifiedEntries.map((e) => e.entryId),
    }),
  });

  return bracketResponse.json();
};
```
