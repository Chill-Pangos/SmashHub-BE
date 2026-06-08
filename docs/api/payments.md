# Payments

Payment and payout endpoints

Total endpoints: 12

## POST /api/payments
Tag: Payments
Summary: Create payment for entry

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - entryId: integer
  - amount: number
  - method: string | choices: cash, bank_transfer, online
Example payload:
```json
{
  "entryId": 1,
  "amount": 1,
  "method": "cash"
}
```

Responses:
### 201
Payment created

---

## POST /api/payments/cash
Tag: Payments
Summary: Record cash payment

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - entryId: integer
  - amount: number
Example payload:
```json
{
  "entryId": 1,
  "amount": 1
}
```

Responses:
### 201
Cash payment recorded

---

## POST /api/payments/online
Tag: Payments
Summary: Record online payment (webhook simulation)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - entryId: integer
  - amount: number
  - transactionRef: string
Example payload:
```json
{
  "entryId": 1,
  "amount": 1,
  "transactionRef": "string"
}
```

Responses:
### 201
Online payment recorded

---

## GET /api/payments/entry/{entryId}
Tag: Payments
Summary: Get payments by entry

Request parameters:
- entryId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- status (query) | type: string | choices: pending, completed, failed, refunded

Request body:
None

Responses:
### 200
List of payments

---

## GET /api/payments/category/{categoryId}
Tag: Payments
Summary: Get payments by category (admin/organizer)

Auth: bearerAuth

Request parameters:
- categoryId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- status (query) | type: string | choices: pending, completed, failed, refunded
- method (query) | type: string | choices: cash, bank_transfer, online

Request body:
None

Responses:
### 200
List of payments

---

## GET /api/payments/category/{categoryId}/stats
Tag: Payments
Summary: Get payment statistics for category (admin/organizer)

Auth: bearerAuth

Request parameters:
- categoryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Payment statistics

---

## GET /api/payments/pending/{categoryId}
Tag: Payments
Summary: Get pending payments by category (organizer)

Auth: bearerAuth

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- method (query) | type: string | choices: cash, bank_transfer, online

Request body:
None

Responses:
### 200
List of pending payments

---

## GET /api/payments/{paymentId}
Tag: Payments
Summary: Get payment by ID

Request parameters:
- paymentId (path) | type: integer | required

Request body:
None

Responses:
### 200
Payment details

---

## POST /api/payments/{paymentId}/confirm
Tag: Payments
Summary: Confirm payment (organizer)

Auth: bearerAuth

Request parameters:
- paymentId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - proofImageUrl: string
  - transactionRef: string
Example payload:
```json
{
  "proofImageUrl": "string",
  "transactionRef": "string"
}
```

Responses:
### 200
Payment confirmed

---

## POST /api/payments/{paymentId}/reject
Tag: Payments
Summary: Reject payment (organizer)

Auth: bearerAuth

Request parameters:
- paymentId (path) | type: integer | required

Request body:
None

Responses:
### 200
Payment rejected

---

## POST /api/payments/{paymentId}/refund
Tag: Payments
Summary: Refund payment (organizer)

Auth: bearerAuth

Request parameters:
- paymentId (path) | type: integer | required

Request body:
None

Responses:
### 200
Payment refunded

---

## PUT /api/payments/{paymentId}/proof
Tag: Payments
Summary: Upload payment proof image (captain or organizer)

Auth: bearerAuth

Request parameters:
- paymentId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - proofImageUrl: string | URL of the proof image for bank transfer
Example payload:
```json
{
  "proofImageUrl": "string"
}
```

Responses:
### 200
Proof image uploaded successfully

---
