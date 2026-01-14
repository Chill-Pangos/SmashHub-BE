# 📘 API Documentation - Tournament Operations

Tài liệu này mô tả các API để **xem, tìm kiếm, cập nhật và xóa** tournaments.

> 📝 **Lưu ý:** Để tạo tournament mới, xem [API_CREATE_TOURNAMENT.md](./API_CREATE_TOURNAMENT.md)

---

## **Table of Contents**

1. [Get All Tournaments](#1-get-all-tournaments)
2. [Search Tournaments with Filters](#2-search-tournaments-with-filters)
3. [Get Tournament by ID](#3-get-tournament-by-id)
4. [Get Tournaments by Status](#4-get-tournaments-by-status)
5. [Update Tournament](#5-update-tournament)
6. [Delete Tournament](#6-delete-tournament)

---

## **1. Get All Tournaments**

### **Endpoint**

```
GET /api/tournaments
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tất cả tournaments với pagination. Không có filter, trả về tất cả tournaments.

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Example**

```http
GET /api/tournaments?skip=0&limit=20
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "name": "Spring Championship 2026",
    "status": "upcoming",
    "startDate": "2026-03-15T09:00:00Z",
    "endDate": "2026-03-20T18:00:00Z",
    "location": "National Stadium",
    "createdBy": 1,
    "createdAt": "2026-01-14T10:00:00Z",
    "updatedAt": "2026-01-14T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Summer Open 2026",
    "status": "upcoming",
    "startDate": "2026-06-10T08:00:00Z",
    "endDate": null,
    "location": "City Sports Center",
    "createdBy": 2,
    "createdAt": "2026-01-15T14:30:00Z",
    "updatedAt": "2026-01-15T14:30:00Z"
  }
]
```

### **Error Responses**

```json
{
  "message": "Error fetching tournaments",
  "error": {}
}
```

---

## **2. Search Tournaments with Filters**

### **Endpoint**

```
GET /api/tournaments/search
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Tìm kiếm tournaments với nhiều bộ lọc chi tiết. API này rất mạnh mẽ để filter tournaments theo:

- User tham gia (userId)
- Người tạo tournament (createdBy)
- Điều kiện tuổi (age restrictions)
- Điều kiện ELO (skill level)
- Giới tính
- Và các thuộc tính khác của tournament contents

### **Query Parameters**

#### **Pagination:**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

#### **User Filters:**

| Parameter   | Type    | Description                                     | Example |
| ----------- | ------- | ----------------------------------------------- | ------- |
| `userId`    | integer | Lọc tournaments mà user này đã đăng ký tham gia | `1`     |
| `createdBy` | integer | Lọc tournaments được tạo bởi user này           | `1`     |

#### **Age Filters:**

| Parameter | Type    | Description                                                   | Example |
| --------- | ------- | ------------------------------------------------------------- | ------- |
| `minAge`  | integer | Lọc contents có minAge <= giá trị này (user đủ tuổi tham gia) | `18`    |
| `maxAge`  | integer | Lọc contents có maxAge >= giá trị này (user không quá tuổi)   | `35`    |

#### **ELO Filters:**

| Parameter | Type    | Description                                           | Example |
| --------- | ------- | ----------------------------------------------------- | ------- |
| `minElo`  | integer | Lọc contents có minElo <= giá trị này (đủ trình độ)   | `1000`  |
| `maxElo`  | integer | Lọc contents có maxElo >= giá trị này (không quá cao) | `2000`  |

#### **Other Filters:**

| Parameter      | Type    | Description               | Example  | Enum Values               |
| -------------- | ------- | ------------------------- | -------- | ------------------------- |
| `gender`       | string  | Lọc theo giới tính        | `"male"` | `male`, `female`, `mixed` |
| `racketCheck`  | boolean | Có kiểm tra vợt hay không | `true`   | `true`, `false`           |
| `isGroupStage` | boolean | Có vòng bảng hay không    | `false`  | `true`, `false`           |

### **Filter Logic Explanation**

#### **Age Filter Logic:**

Khi bạn truyền `minAge=18` và `maxAge=35`:

- Hệ thống tìm contents có: `content.minAge <= 18` (user đủ tuổi tối thiểu)
- VÀ: `content.maxAge >= 35` (user chưa quá tuổi tối đa)
- Nếu content có `minAge=16, maxAge=40` → ✅ Match (user 18-35 tuổi có thể tham gia)
- Nếu content có `minAge=21, maxAge=30` → ❌ Không match

#### **ELO Filter Logic:**

Khi bạn truyền `minElo=1200` và `maxElo=1800`:

- Hệ thống tìm contents có: `content.minElo <= 1200` (user đủ trình độ)
- VÀ: `content.maxElo >= 1800` (user không quá mạnh)
- Nếu content có `minElo=1000, maxElo=2000` → ✅ Match
- Nếu content có `minElo=1500, maxElo=2500` → ❌ Không match

### **Request Examples**

#### **Example 1: Tìm tournaments mà user ID 5 đã đăng ký**

```http
GET /api/tournaments/search?userId=5
```

#### **Example 2: Tìm tournaments phù hợp với user 25 tuổi, ELO 1500**

```http
GET /api/tournaments/search?minAge=25&maxAge=25&minElo=1500&maxElo=1500
```

#### **Example 3: Tìm tournaments nam, có vòng bảng, kiểm tra vợt**

```http
GET /api/tournaments/search?gender=male&isGroupStage=true&racketCheck=true
```

#### **Example 4: Tìm tournaments do user 3 tạo**

```http
GET /api/tournaments/search?createdBy=3&skip=0&limit=10
```

#### **Example 5: Combined filters**

```http
GET /api/tournaments/search?gender=female&minAge=18&maxAge=30&minElo=1200&maxElo=1800&racketCheck=true&limit=20
```

### **Response - 200 OK**

```json
{
  "tournaments": [
    {
      "id": 1,
      "name": "Spring Championship 2026",
      "status": "upcoming",
      "startDate": "2026-03-15T09:00:00Z",
      "endDate": "2026-03-20T18:00:00Z",
      "location": "National Stadium",
      "createdBy": 1,
      "createdAt": "2026-01-14T10:00:00Z",
      "updatedAt": "2026-01-14T10:00:00Z",
      "contents": [
        {
          "id": 1,
          "tournamentId": 1,
          "name": "Women's Singles U21",
          "type": "single",
          "maxEntries": 32,
          "maxSets": 3,
          "minAge": 15,
          "maxAge": 21,
          "minElo": 1000,
          "maxElo": 2000,
          "gender": "female",
          "racketCheck": true,
          "isGroupStage": false,
          "createdAt": "2026-01-14T10:00:00Z",
          "updatedAt": "2026-01-14T10:00:00Z"
        }
      ]
    }
  ],
  "total": 42
}
```

### **Response Structure**

| Field         | Type    | Description                                 |
| ------------- | ------- | ------------------------------------------- |
| `tournaments` | array   | Danh sách tournaments match với filters     |
| `total`       | integer | Tổng số tournaments (không tính pagination) |

### **Error Responses**

```json
{
  "message": "Error fetching tournaments with filters",
  "error": {}
}
```

---

## **3. Get Tournament by ID**

### **Endpoint**

```
GET /api/tournaments/{id}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy thông tin chi tiết của một tournament theo ID, bao gồm tất cả tournament contents.

### **Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Tournament ID |

### **Request Example**

```http
GET /api/tournaments/1
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "name": "Spring Championship 2026",
  "status": "upcoming",
  "startDate": "2026-03-15T09:00:00Z",
  "endDate": "2026-03-20T18:00:00Z",
  "location": "National Stadium",
  "createdBy": 1,
  "createdAt": "2026-01-14T10:00:00Z",
  "updatedAt": "2026-01-14T10:00:00Z",
  "contents": [
    {
      "id": 1,
      "tournamentId": 1,
      "name": "Men's Singles",
      "type": "single",
      "maxEntries": 32,
      "maxSets": 3,
      "numberOfSingles": null,
      "numberOfDoubles": null,
      "minAge": 15,
      "maxAge": 21,
      "minElo": 1200,
      "maxElo": 1800,
      "gender": "male",
      "racketCheck": true,
      "isGroupStage": false,
      "createdAt": "2026-01-14T10:00:00Z",
      "updatedAt": "2026-01-14T10:00:00Z"
    },
    {
      "id": 2,
      "tournamentId": 1,
      "name": "Men's Team",
      "type": "team",
      "maxEntries": 8,
      "maxSets": 3,
      "numberOfSingles": 4,
      "numberOfDoubles": 1,
      "minAge": null,
      "maxAge": null,
      "minElo": null,
      "maxElo": null,
      "gender": "male",
      "racketCheck": true,
      "isGroupStage": true,
      "createdAt": "2026-01-14T10:00:00Z",
      "updatedAt": "2026-01-14T10:00:00Z"
    }
  ]
}
```

### **Error Responses**

**404 Not Found** - Tournament không tồn tại

```json
{
  "message": "Tournament not found"
}
```

**500 Internal Server Error**

```json
{
  "message": "Error fetching tournament",
  "error": {}
}
```

---

## **4. Get Tournaments by Status**

### **Endpoint**

```
GET /api/tournaments/status/{status}
```

### **Authentication**

❌ **Not Required** - Public endpoint

### **Description**

Lấy danh sách tournaments theo trạng thái (upcoming, ongoing, completed).

### **Path Parameters**

| Parameter | Type   | Required | Description                      | Enum Values                        |
| --------- | ------ | -------- | -------------------------------- | ---------------------------------- |
| `status`  | string | Yes      | Trạng thái tournament cần filter | `upcoming`, `ongoing`, `completed` |

### **Query Parameters**

| Parameter | Type    | Required | Default | Description                    |
| --------- | ------- | -------- | ------- | ------------------------------ |
| `skip`    | integer | No       | `0`     | Số lượng records bỏ qua        |
| `limit`   | integer | No       | `10`    | Số lượng records tối đa trả về |

### **Request Examples**

```http
GET /api/tournaments/status/upcoming

GET /api/tournaments/status/ongoing?skip=0&limit=20

GET /api/tournaments/status/completed?limit=50
```

### **Response - 200 OK**

```json
[
  {
    "id": 1,
    "name": "Spring Championship 2026",
    "status": "upcoming",
    "startDate": "2026-03-15T09:00:00Z",
    "endDate": "2026-03-20T18:00:00Z",
    "location": "National Stadium",
    "createdBy": 1,
    "createdAt": "2026-01-14T10:00:00Z",
    "updatedAt": "2026-01-14T10:00:00Z"
  }
]
```

### **Error Responses**

**400 Bad Request** - Status không hợp lệ

```json
{
  "message": "Invalid status value. Must be one of: upcoming, ongoing, completed"
}
```

**500 Internal Server Error**

```json
{
  "message": "Error fetching tournaments by status",
  "error": {}
}
```

---

## **5. Update Tournament**

### **Endpoint**

```
PUT /api/tournaments/{id}
```

### **Authentication**

✅ **Required** - Cần Bearer Token trong header

```
Authorization: Bearer <your_access_token>
```

### **Description**

Cập nhật thông tin tournament và có thể cập nhật cả tournament contents.

⚠️ **QUAN TRỌNG:**

- Nếu gửi field `contents`, tất cả contents cũ sẽ bị **XÓA** và **THAY THẾ** bằng contents mới
- Nếu không gửi field `contents`, chỉ cập nhật thông tin tournament (contents giữ nguyên)

### **Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Tournament ID |

### **Request Body**

Tất cả fields đều **optional** - chỉ gửi những gì cần update.

#### **Tournament Fields:**

| Field       | Type              | Description                  | Example                      |
| ----------- | ----------------- | ---------------------------- | ---------------------------- |
| `name`      | string            | Tên của tournament           | `"Spring Championship 2026"` |
| `startDate` | string (ISO 8601) | Ngày giờ bắt đầu             | `"2026-03-15T09:00:00Z"`     |
| `endDate`   | string (ISO 8601) | Ngày giờ kết thúc            | `"2026-03-20T18:00:00Z"`     |
| `location`  | string            | Địa điểm tổ chức             | `"National Stadium"`         |
| `status`    | enum string       | Trạng thái tournament        | `"ongoing"`                  |
| `contents`  | array             | **Thay thế** tất cả contents | Xem structure bên dưới       |

**Status enum:** `upcoming`, `ongoing`, `completed`

#### **Contents Structure (nếu muốn update contents):**

Xem chi tiết tại [API_CREATE_TOURNAMENT.md](./API_CREATE_TOURNAMENT.md#tournament-contents-structure-trong-array-contents)

### **Request Examples**

#### **Example 1: Update chỉ thông tin tournament (không đụng contents)**

```json
{
  "name": "Spring Championship 2026 - Updated",
  "status": "ongoing",
  "location": "National Stadium - Hall A"
}
```

#### **Example 2: Update tournament và thay thế toàn bộ contents**

```json
{
  "name": "Spring Championship 2026 - Final",
  "status": "completed",
  "contents": [
    {
      "name": "Men's Singles Final",
      "type": "single",
      "maxEntries": 16,
      "maxSets": 5,
      "minAge": 18,
      "maxAge": 35,
      "gender": "male",
      "racketCheck": true,
      "isGroupStage": false
    }
  ]
}
```

#### **Example 3: Update chỉ status**

```json
{
  "status": "ongoing"
}
```

#### **Example 4: Update và xóa tất cả contents**

```json
{
  "name": "Tournament Name",
  "contents": []
}
```

### **Response - 200 OK**

```json
{
  "id": 1,
  "name": "Spring Championship 2026 - Updated",
  "status": "ongoing",
  "startDate": "2026-03-15T09:00:00Z",
  "endDate": "2026-03-20T18:00:00Z",
  "location": "National Stadium - Hall A",
  "createdBy": 1,
  "createdAt": "2026-01-14T10:00:00Z",
  "updatedAt": "2026-01-15T15:30:00Z",
  "contents": [
    {
      "id": 10,
      "tournamentId": 1,
      "name": "Men's Singles Final",
      "type": "single",
      "maxEntries": 16,
      "maxSets": 5,
      "minAge": 18,
      "maxAge": 35,
      "minElo": null,
      "maxElo": null,
      "gender": "male",
      "racketCheck": true,
      "isGroupStage": false,
      "createdAt": "2026-01-15T15:30:00Z",
      "updatedAt": "2026-01-15T15:30:00Z"
    }
  ]
}
```

### **Error Responses**

**400 Bad Request** - Dữ liệu không hợp lệ

```json
{
  "message": "Error updating tournament content",
  "error": {}
}
```

**401 Unauthorized** - Chưa đăng nhập

```json
{
  "message": "Unauthorized - User not authenticated"
}
```

**404 Not Found** - Tournament không tồn tại

```json
{
  "message": "Tournament not found"
}
```

---

## **6. Delete Tournament**

### **Endpoint**

```
DELETE /api/tournaments/{id}
```

### **Authentication**

✅ **Required** - Cần Bearer Token trong header

```
Authorization: Bearer <your_access_token>
```

### **Description**

Xóa một tournament. Tournament contents liên quan cũng sẽ bị xóa (cascade delete).

### **Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Tournament ID |

### **Request Example**

```http
DELETE /api/tournaments/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Response - 204 No Content**

Không có response body. Status code 204 nghĩa là xóa thành công.

### **Error Responses**

**401 Unauthorized** - Chưa đăng nhập

```json
{
  "message": "Unauthorized - User not authenticated"
}
```

**404 Not Found** - Tournament không tồn tại

```json
{
  "message": "Tournament not found"
}
```

**500 Internal Server Error**

```json
{
  "message": "Error deleting tournament",
  "error": {}
}
```

---

## **Important Notes cho Frontend**

### **1. Pagination**

- Tất cả list APIs đều support pagination với `skip` và `limit`
- Default: `skip=0`, `limit=10`
- Để lấy tất cả, set `limit` lớn (ví dụ: `limit=1000`)

### **2. Date Format**

- Luôn sử dụng ISO 8601 format: `"2026-03-15T09:00:00Z"`
- Backend sẽ parse và validate format

### **3. Search API - Filter Logic**

⚠️ **Hiểu rõ logic filtering:**

```javascript
// User 25 tuổi, ELO 1500 muốn tìm tournaments phù hợp
const userAge = 25;
const userElo = 1500;

// Gửi request
GET /api/tournaments/search?minAge=${userAge}&maxAge=${userAge}&minElo=${userElo}&maxElo=${userElo}

// Backend sẽ tìm contents thỏa:
// - content.minAge <= 25 (user đủ tuổi)
// - content.maxAge >= 25 (user chưa quá tuổi)
// - content.minElo <= 1500 (user đủ trình độ)
// - content.maxElo >= 1500 (user không quá mạnh)
```

### **4. Update Tournament - Contents Replacement**

```javascript
// ❌ SAI: Muốn thêm 1 content mới vào tournament
PUT /api/tournaments/1
{
  "contents": [
    { "name": "New Content", ... }
  ]
}
// → Sẽ XÓA tất cả contents cũ, chỉ giữ lại "New Content"

// ✅ ĐÚNG: Phải GET tournament trước, merge contents, rồi PUT
// Step 1: GET current tournament
const tournament = await GET /api/tournaments/1

// Step 2: Add new content to existing contents
tournament.contents.push({ "name": "New Content", ... })

// Step 3: PUT with all contents
PUT /api/tournaments/1
{
  "contents": tournament.contents
}
```

### **5. Authentication**

- ✅ **Required:** POST (create), PUT (update), DELETE
- ❌ **Not Required:** GET (all read operations)

### **6. Enum Values**

**Status:** `upcoming`, `ongoing`, `completed`  
**Type:** `single`, `team`, `double`  
**Gender:** `male`, `female`, `mixed`

Phải viết chính xác, lowercase, không viết hoa.

### **7. Boolean Parameters trong Query String**

```javascript
// ✅ ĐÚNG
?racketCheck=true
?racketCheck=false

// ❌ SAI
?racketCheck=1
?racketCheck=0
?racketCheck="true"
```

### **8. Filter Combinations**

Tất cả filters có thể combine với nhau:

```http
GET /api/tournaments/search?userId=5&gender=male&minAge=18&maxAge=35&racketCheck=true&skip=0&limit=20
```

---

## **Use Cases & Examples**

### **Use Case 1: User xem tournaments mình đã đăng ký**

```javascript
const userId = getCurrentUser().id;
const response = await fetch(`/api/tournaments/search?userId=${userId}`);
const { tournaments, total } = await response.json();
```

### **Use Case 2: User tìm tournaments phù hợp với profile**

```javascript
const userProfile = {
  age: 25,
  elo: 1500,
  gender: "male",
};

const url = `/api/tournaments/search?minAge=${userProfile.age}&maxAge=${userProfile.age}&minElo=${userProfile.elo}&maxElo=${userProfile.elo}&gender=${userProfile.gender}`;

const response = await fetch(url);
const { tournaments, total } = await response.json();
```

### **Use Case 3: Admin xem tournaments đang diễn ra**

```javascript
const response = await fetch("/api/tournaments/status/ongoing");
const ongoingTournaments = await response.json();
```

### **Use Case 4: Organizer update tournament status**

```javascript
const response = await fetch(`/api/tournaments/${tournamentId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    status: "ongoing",
  }),
});
```

### **Use Case 5: Pagination - Load more**

```javascript
const [tournaments, setTournaments] = useState([]);
const [skip, setSkip] = useState(0);
const limit = 10;

const loadMore = async () => {
  const response = await fetch(`/api/tournaments?skip=${skip}&limit=${limit}`);
  const newTournaments = await response.json();

  setTournaments([...tournaments, ...newTournaments]);
  setSkip(skip + limit);
};
```

---

## **TypeScript Interfaces**

```typescript
// Tournament Response
interface Tournament {
  id: number;
  name: string;
  status: "upcoming" | "ongoing" | "completed";
  startDate: string; // ISO 8601
  endDate?: string | null;
  location: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  contents?: TournamentContent[];
}

// Tournament Content Response
interface TournamentContent {
  id: number;
  tournamentId: number;
  name: string;
  type: "single" | "team" | "double";
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number | null;
  numberOfDoubles?: number | null;
  minAge?: number | null;
  maxAge?: number | null;
  minElo?: number | null;
  maxElo?: number | null;
  gender?: "male" | "female" | "mixed" | null;
  racketCheck: boolean;
  isGroupStage?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

// Search Response
interface SearchTournamentsResponse {
  tournaments: Tournament[];
  total: number;
}

// Update Tournament Request
interface UpdateTournamentRequest {
  name?: string;
  startDate?: string;
  endDate?: string | null;
  location?: string;
  status?: "upcoming" | "ongoing" | "completed";
  contents?: UpdateTournamentContentDto[];
}

// Update Tournament Content DTO
interface UpdateTournamentContentDto {
  name: string;
  type: "single" | "team" | "double";
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;
  gender?: "male" | "female" | "mixed";
  racketCheck: boolean;
  isGroupStage?: boolean;
}
```
