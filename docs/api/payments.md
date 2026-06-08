# Payments

Payment and entry fee management endpoints

Total endpoints: 12

## POST /api/payments
Tag: Payments
Summary: Create pending payment for entry

Create a pending payment record for an entry using bank transfer or online method.
The payment amount MUST match the category's entry fee exactly (within 0.01 tolerance).

Business Logic:
- Only one active payment (pending or completed) is allowed per entry
- Cash payments should use POST /payments/record-cash endpoint instead
- For bank transfers: proof image must be uploaded before confirmation
- For online payments: transaction reference is required from payment gateway
- Authenticated user is recording the payment attempt

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - entryId: integer | required | ID of the entry that requires payment
  - amount: number | required | Payment amount in VND. Must match the category's entry fee exactly
  - method: string | required | Payment method (bank_transfer for manual bank transfers, online for payment gateway webhooks) | choices: bank_transfer, online
Example payload:
```json
{
  "entryId": 42,
  "amount": 250000,
  "method": "bank_transfer"
}
```

Responses:
### 201
Description: Payment created successfully with pending status
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - entryId: integer
    - amount: number
    - method: string | choices: bank_transfer, online
    - status: string | choices: pending, completed, failed, refunded
    - proofImageUrl: string | URL of bank transfer proof (null until confirmed)
    - transactionRef: string | Payment gateway transaction reference (null until confirmed)
    - confirmedBy: integer | ID of organizer who confirmed the payment (null until confirmed)
    - confirmedAt: string | Timestamp when payment was confirmed (null until confirmed)
    - refundedAt: string | Timestamp when payment was refunded (null unless refunded)
    - createdAt: string
    - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "entryId": 42,
    "amount": 250000,
    "method": "bank_transfer",
    "status": "pending",
    "proofImageUrl": null,
    "transactionRef": null,
    "confirmedBy": null,
    "confirmedAt": null,
    "refundedAt": null,
    "createdAt": "2026-05-27T10:30:00Z",
    "updatedAt": "2026-05-27T10:30:00Z"
  },
  "message": "Payment created successfully"
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 409
Description: Conflict - resource already exists or state conflict
Type: object
Example response:
```json
{
  "message": "Resource already exists"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## POST /api/payments/record-cash
Tag: Payments
Summary: Record and confirm cash payment (organizer only)

Record and immediately confirm a cash payment for an entry in a single operation.
Only tournament organizers can use this endpoint.

Business Logic:
- Cash payments are confirmed immediately (status = completed)
- Authenticated organizer user ID is recorded as confirmedBy
- Amount MUST match the category's entry fee exactly
- Only one cash payment per entry is allowed
- No proof image or transaction reference is required for cash

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - entryId: integer | required | ID of the entry receiving cash payment
  - amount: number | required | Cash payment amount in VND. Must match entry fee
Example payload:
```json
{
  "entryId": 42,
  "amount": 250000
}
```

Responses:
### 201
Description: Cash payment recorded and immediately confirmed
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - entryId: integer
    - amount: number
    - method: string | choices: cash, bank_transfer, online
    - status: string | Always 'completed' for cash payments | choices: pending, completed, failed, refunded
    - confirmedBy: integer | Organizer user ID who recorded the cash payment
    - confirmedAt: string | Timestamp when cash payment was recorded
    - proofImageUrl: string
    - transactionRef: string
    - refundedAt: string
    - createdAt: string
    - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "entryId": 42,
    "amount": 250000,
    "method": "cash",
    "status": "completed",
    "confirmedBy": 5,
    "confirmedAt": "2026-05-27T10:35:00Z",
    "proofImageUrl": null,
    "transactionRef": null,
    "refundedAt": null,
    "createdAt": "2026-05-27T10:35:00Z",
    "updatedAt": "2026-05-27T10:35:00Z"
  },
  "message": "Cash payment recorded successfully"
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 409
Description: Conflict - resource already exists or state conflict
Type: object
Example response:
```json
{
  "message": "Resource already exists"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## POST /api/payments/record-online
Tag: Payments
Summary: Record online payment from payment gateway webhook

Record and immediately confirm an online payment from payment gateway webhook (Stripe, VNPay, etc.).
This endpoint processes successful online transactions and creates a confirmed payment record.

Business Logic:
- Online payments are confirmed immediately (status = completed)
- Transaction reference is required and must be unique to prevent double-processing
- Amount MUST match the category's entry fee exactly
- This endpoint is typically called by payment gateway webhooks (no manual confirmation needed)
- Duplicate transaction references are rejected to ensure idempotency

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - entryId: integer | required | ID of the entry being paid for
  - amount: number | required | Payment amount in VND. Must match entry fee
  - transactionRef: string | required | Unique transaction reference from payment gateway (Stripe PI, VNPay txnRef, etc.). Must be globally unique
Example payload:
```json
{
  "entryId": 42,
  "amount": 250000,
  "transactionRef": "stripe_pi_1234567890abc"
}
```

Responses:
### 201
Description: Online payment recorded and confirmed successfully
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - entryId: integer
    - amount: number
    - method: string | choices: cash, bank_transfer, online
    - status: string | Always 'completed' for online payments | choices: pending, completed, failed, refunded
    - transactionRef: string | Payment gateway transaction reference
    - confirmedBy: integer | Null for online payments (auto-confirmed by webhook)
    - confirmedAt: string | Timestamp when payment was confirmed by webhook
    - proofImageUrl: string
    - refundedAt: string
    - createdAt: string
    - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "entryId": 42,
    "amount": 250000,
    "method": "online",
    "status": "completed",
    "transactionRef": "stripe_pi_1234567890abc",
    "confirmedBy": null,
    "confirmedAt": "2026-05-27T10:40:00Z",
    "proofImageUrl": null,
    "refundedAt": null,
    "createdAt": "2026-05-27T10:40:00Z",
    "updatedAt": "2026-05-27T10:40:00Z"
  },
  "message": "Online payment recorded successfully"
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 409
Description: Conflict - resource already exists or state conflict
Type: object
Example response:
```json
{
  "message": "Resource already exists"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/payments/entry/{entryId}
Tag: Payments
Summary: Get payments for an entry

Retrieve all payments for a specific entry with pagination and optional status filtering.

Business Logic:
- Typically a team captain would check their entry's payment status
- Returns latest payments first (sorted by createdAt DESC)
- Team captain can view their payment status
- Entry must exist

Request parameters:
- entryId (path) | type: integer | required | Entry ID to retrieve payments for
- page (query) | type: integer | Page number for pagination (1-indexed) | default: 1
- limit (query) | type: integer | Maximum number of records per page | default: 10
- status (query) | type: string | Filter by payment status (optional) | choices: pending, completed, failed, refunded

Request body:
None

Responses:
### 200
Description: List of payments for entry with pagination
Type: object
Body:
  - success: boolean
  - data: object
    - rows: array
      - items: object
        - id: integer
        - entryId: integer
        - amount: number
        - method: string | choices: cash, bank_transfer, online
        - status: string | choices: pending, completed, failed, refunded
        - proofImageUrl: string
        - transactionRef: string
        - confirmedBy: integer | Organizer user ID
        - confirmedAt: string
        - refundedAt: string
        - createdAt: string
        - updatedAt: string
    - count: integer | Total number of payments for this entry
Example response:
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": 1,
        "entryId": 42,
        "amount": 250000,
        "method": "bank_transfer",
        "status": "completed",
        "proofImageUrl": null,
        "transactionRef": null,
        "confirmedBy": 5,
        "confirmedAt": "2026-05-27T10:35:00Z",
        "refundedAt": null,
        "createdAt": "2026-05-27T10:30:00Z",
        "updatedAt": "2026-05-27T10:35:00Z"
      }
    ],
    "count": 1
  }
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/payments/category/{categoryId}
Tag: Payments
Summary: Get payments by category (organizer only)

Retrieve all payments for a tournament category with optional filtering by status and payment method. Only tournament organizers can access this endpoint.

Auth: bearerAuth

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records per page | default: 10
- status (query) | type: string | Filter by payment status | choices: pending, completed, failed, refunded
- method (query) | type: string | Filter by payment method | choices: cash, bank_transfer, online

Request body:
None

Responses:
### 200
Description: List of payments for category with pagination
Type: object
Body:
  - success: boolean
  - data: object
    - rows: array
      - items: object
        - id: integer
        - entryId: integer
        - amount: number
        - method: string | choices: cash, bank_transfer, online
        - status: string | choices: pending, completed, failed, refunded
        - proofImageUrl: string
        - confirmedBy: integer
        - confirmedAt: string
        - createdAt: string
        - entry: object
          - id: integer
          - captainId: integer
        - confirmer: object
          - id: integer
          - firstName: string
          - lastName: string
          - email: string
    - count: integer | Total number of records
Example response:
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": 1,
        "entryId": 42,
        "amount": 250000,
        "method": "bank_transfer",
        "status": "completed",
        "proofImageUrl": "https://s3.example.com/proof-123.jpg",
        "confirmedBy": 5,
        "confirmedAt": "2026-05-27T10:35:00Z",
        "createdAt": "2026-05-27T10:30:00Z",
        "entry": {
          "id": 1,
          "captainId": 1
        },
        "confirmer": {
          "id": 1,
          "firstName": "string",
          "lastName": "string",
          "email": "string"
        }
      }
    ],
    "count": 25
  }
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/payments/category/{categoryId}/stats
Tag: Payments
Summary: Get payment statistics for category (organizer only)

Retrieve aggregated payment statistics for a tournament category including totals, completion rates, and amounts collected. Only tournament organizers can access this endpoint.

Auth: bearerAuth

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID

Request body:
None

Responses:
### 200
Description: Payment statistics for category
Type: object
Body:
  - success: boolean
  - data: object
    - total: integer | Total number of payments
    - completed: integer | Number of completed payments
    - pending: integer | Number of pending payments
    - failed: integer | Number of failed/rejected payments
    - refunded: integer | Number of refunded payments
    - totalAmount: number | Total amount of all payments
    - collectedAmount: number | Total amount collected (completed + cash payments)
Example response:
```json
{
  "success": true,
  "data": {
    "total": 50,
    "completed": 35,
    "pending": 10,
    "failed": 3,
    "refunded": 2,
    "totalAmount": 12500000,
    "collectedAmount": 8750000
  }
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/payments/pending/{categoryId}
Tag: Payments
Summary: Get pending payments by category (organizer only)

Retrieve all pending payments for a tournament category with optional filtering by payment method. Ordered by oldest first for priority processing. Only tournament organizers can access this endpoint.

Auth: bearerAuth

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records per page | default: 10
- method (query) | type: string | Filter by payment method (optional) | choices: cash, bank_transfer, online

Request body:
None

Responses:
### 200
Description: List of pending payments ordered by oldest first
Type: object
Body:
  - success: boolean
  - data: object
    - rows: array
      - items: object
        - id: integer
        - entryId: integer
        - amount: number
        - method: string | choices: cash, bank_transfer, online
        - status: string | choices: pending, completed, failed, refunded
        - proofImageUrl: string
        - transactionRef: string
        - createdAt: string
        - entry: object
          - id: integer
          - categoryId: integer
          - captainId: integer
          - category: object
            - id: integer
            - tournamentId: integer
            - name: string
            - entryFee: number
    - count: integer | Total number of pending payments
Example response:
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": 5,
        "entryId": 42,
        "amount": 250000,
        "method": "bank_transfer",
        "status": "pending",
        "proofImageUrl": "https://s3.example.com/proof-123.jpg",
        "transactionRef": null,
        "createdAt": "2026-05-27T09:00:00Z",
        "entry": {
          "id": 1,
          "categoryId": 1,
          "captainId": 1,
          "category": {
            "id": 1,
            "tournamentId": 1,
            "name": "string",
            "entryFee": 1
          }
        }
      }
    ],
    "count": 5
  }
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/payments/{paymentId}
Tag: Payments
Summary: Get payment by ID

Retrieve detailed information about a specific payment including entry details, confirmation status, and proof images.

Request parameters:
- paymentId (path) | type: integer | required | Payment ID

Request body:
None

Responses:
### 200
Description: Payment details retrieved successfully
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - entryId: integer
    - amount: number
    - method: string | choices: cash, bank_transfer, online
    - status: string | choices: pending, completed, failed, refunded
    - proofImageUrl: string
    - transactionRef: string
    - confirmedBy: integer | ID of organizer who confirmed
    - confirmedAt: string
    - refundedAt: string
    - createdAt: string
    - updatedAt: string
    - entry: object
      - id: integer
      - categoryId: integer
      - captainId: integer
    - confirmer: object
      - id: integer
      - firstName: string
      - lastName: string
      - email: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "entryId": 42,
    "amount": 250000,
    "method": "bank_transfer",
    "status": "pending",
    "proofImageUrl": "https://s3.example.com/proof-123.jpg",
    "transactionRef": null,
    "confirmedBy": null,
    "confirmedAt": null,
    "refundedAt": null,
    "createdAt": "2026-05-27T10:30:00Z",
    "updatedAt": "2026-05-27T10:30:00Z",
    "entry": {
      "id": 42,
      "categoryId": 10,
      "captainId": 100
    },
    "confirmer": {
      "id": 1,
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    }
  }
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## POST /api/payments/{paymentId}/confirm
Tag: Payments
Summary: Confirm payment (organizer only)

Confirm a pending payment. For bank transfers, proof image URL is required. For online payments, transaction reference is required. Only tournament organizers can confirm payments.

Auth: bearerAuth

Request parameters:
- paymentId (path) | type: integer | required | Payment ID to confirm

Request body:
Required: yes
Type: object
Fields:
  - proofImageUrl: string | URL of proof image (required for bank_transfer, optional for others)
  - transactionRef: string | Transaction reference (required for online payments)
Example payload:
```json
{
  "proofImageUrl": "https://s3.example.com/proof-123.jpg",
  "transactionRef": "vnpay_123456"
}
```

Responses:
### 200
Description: Payment confirmed successfully
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - entryId: integer
    - amount: number
    - method: string | choices: cash, bank_transfer, online
    - status: string | choices: pending, completed, failed, refunded
    - proofImageUrl: string
    - transactionRef: string
    - confirmedBy: integer
    - confirmedAt: string
    - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "entryId": 42,
    "amount": 250000,
    "method": "bank_transfer",
    "status": "completed",
    "proofImageUrl": "https://s3.example.com/proof-123.jpg",
    "transactionRef": null,
    "confirmedBy": 5,
    "confirmedAt": "2026-05-27T10:35:00Z",
    "updatedAt": "2026-05-27T10:35:00Z"
  },
  "message": "Payment confirmed successfully"
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## POST /api/payments/{paymentId}/reject
Tag: Payments
Summary: Reject pending payment (organizer only)

Reject a pending payment, marking it as failed. Only tournament organizers can reject payments. Can only reject payments in pending status.

Auth: bearerAuth

Request parameters:
- paymentId (path) | type: integer | required | Payment ID to reject

Request body:
None

Responses:
### 200
Description: Payment rejected successfully
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - entryId: integer
    - amount: number
    - method: string | choices: cash, bank_transfer, online
    - status: string | choices: pending, completed, failed, refunded
    - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "entryId": 42,
    "amount": 250000,
    "method": "bank_transfer",
    "status": "failed",
    "updatedAt": "2026-05-27T10:40:00Z"
  },
  "message": "Payment rejected successfully"
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## POST /api/payments/{paymentId}/refund
Tag: Payments
Summary: Refund completed payment (organizer only)

Initiate a refund for a completed payment. Only tournament organizers can process refunds. Can only refund payments in completed status.

Auth: bearerAuth

Request parameters:
- paymentId (path) | type: integer | required | Payment ID to refund

Request body:
None

Responses:
### 200
Description: Payment refunded successfully
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - entryId: integer
    - amount: number
    - method: string | choices: cash, bank_transfer, online
    - status: string | choices: pending, completed, failed, refunded
    - refundedAt: string
    - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "entryId": 42,
    "amount": 250000,
    "method": "bank_transfer",
    "status": "refunded",
    "refundedAt": "2026-05-27T10:45:00Z",
    "updatedAt": "2026-05-27T10:45:00Z"
  },
  "message": "Payment refunded successfully"
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## PUT /api/payments/{paymentId}/proof
Tag: Payments
Summary: Upload payment proof image

Upload or update proof image for bank transfer payments. Only the team captain or tournament organizer can upload proof. Proof is only applicable for bank transfer method and pending payments.

Auth: bearerAuth

Request parameters:
- paymentId (path) | type: integer | required | Payment ID

Request body:
Required: yes
Type: object
Fields:
  - proofImageUrl: string | required | URL of the proof image (screenshot of bank transfer, etc.)
Example payload:
```json
{
  "proofImageUrl": "https://s3.example.com/proof-transfer-123.jpg"
}
```

Responses:
### 200
Description: Proof image uploaded successfully
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - entryId: integer
    - amount: number
    - method: string | choices: cash, bank_transfer, online
    - status: string | choices: pending, completed, failed, refunded
    - proofImageUrl: string
    - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "entryId": 42,
    "amount": 250000,
    "method": "bank_transfer",
    "status": "pending",
    "proofImageUrl": "https://s3.example.com/proof-transfer-123.jpg",
    "updatedAt": "2026-05-27T10:32:00Z"
  },
  "message": "Payment proof uploaded successfully"
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---
