# Knockout Brackets

Knockout bracket management endpoints

Total endpoints: 7

## POST /api/knockout-brackets/generate
Tag: Knockout Brackets
Summary: Generate knockout bracket from entries (no group stage)

Tạo cấu trúc nhánh đấu vòng loại trực tiếp từ danh sách entries.
Dùng cho giải đấu không có vòng bảng.

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
### 201
Bracket generated successfully

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

## POST /api/knockout-brackets/advance-winner
Tag: Knockout Brackets
Summary: Advance winner to next round

Cập nhật winner và tự động advance sang bracket tiếp theo

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - bracketId: integer | required | ID của bracket hiện tại
  - winnerEntryId: integer | required | ID của entry thắng
Example payload:
```json
{
  "bracketId": 1,
  "winnerEntryId": 5
}
```

Responses:
### 200
Winner advanced successfully

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

## POST /api/knockout-brackets/generate-from-group-stage
Tag: Knockout Brackets
Summary: Generate knockout bracket from group stage results

Tạo nhánh đấu knockout từ kết quả vòng bảng:
1. Lấy top 2 mỗi bảng (nhất và nhì)
2. Chia đều bye matches vào 2 nhánh
3. Cân bằng 2 nhánh đấu

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
  - qualifiersPerGroup: integer | Number of qualifiers per group (default 2)
Example payload:
```json
{
  "categoryId": 1,
  "qualifiersPerGroup": 2
}
```

Responses:
### 201
Bracket generated from groups successfully

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

## POST /api/knockout-brackets/validate
Tag: Knockout Brackets
Summary: Validate bracket integrity

Kiểm tra bracket tree có hợp lệ:
- Tất cả bracket round 1 đã có đủ entries hoặc là bye
- Không có entry nào xuất hiện 2 lần
- Bracket tree liên kết đúng
- Số lượng brackets đúng với bracket size

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
Validation result

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

## GET /api/knockout-brackets/category/{categoryId}/tree
Tag: Knockout Brackets
Summary: Get full bracket tree structure

Lấy toàn bộ cấu trúc nhánh đấu theo tournament category

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID

Request body:
None

Responses:
### 200
Bracket tree retrieved successfully

### 400
Bad request - no brackets found

---

## GET /api/knockout-brackets/category/{categoryId}/standings
Tag: Knockout Brackets
Summary: Get tournament standings

Lấy kết quả xếp hạng cuối giải knockout:
- Vô địch: winner của Final
- Á quân: loser của Final
- Hạng 3: loser của Semi-final (đồng hạng 3)

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID

Request body:
None

Responses:
### 200
Standings retrieved successfully

### 400
Tournament not completed yet

---

## GET /api/knockout-brackets/category/{categoryId}/entry
Tag: Knockout Brackets
Summary: Get brackets by entry ID or entry name

Lấy tất cả brackets liên quan đến 1 entry theo ID hoặc tên

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID
- entryId (query) | type: integer | Entry ID
- entryName (query) | type: string | Entry name (team name)

Request body:
None

Responses:
### 200
Brackets retrieved successfully

### 400
Bad request (missing entryId or entryName)

---
