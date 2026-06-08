# Notifications

Real-time notification management endpoints

Total endpoints: 6

## POST /api/notifications/send
Tag: Notifications
Summary: Send notification to user(s) or room

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - userId: string | Send to a specific user
  - userIds: array | Send to multiple users
    - items: string
  - roomId: string | Send to a specific room
  - broadcast: boolean | Broadcast to all connected users
  - type: string | required | Notification type (e.g., match_update, tournament_start)
  - title: string | required | Notification title
  - message: string | required | Notification message
  - data: object | Additional data payload
Example payload:
```json
{
  "userId": "string",
  "userIds": [
    "string"
  ],
  "roomId": "string",
  "broadcast": true,
  "type": "string",
  "title": "string",
  "message": "string",
  "data": null
}
```

Responses:
### 200
Notification sent successfully

### 400
Invalid request

### 401
Unauthorized

### 500
Server error

---

## POST /api/notifications/event
Tag: Notifications
Summary: Send custom event to user or room

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - userId: string | Send to specific user
  - roomId: string | Send to specific room
  - event: string | required | Event name
  - data: object | required | Event data
Example payload:
```json
{
  "userId": "string",
  "roomId": "string",
  "event": "string",
  "data": null
}
```

Responses:
### 200
Event sent successfully

### 400
Invalid request

### 401
Unauthorized

### 500
Server error

---

## GET /api/notifications/connected-users
Tag: Notifications
Summary: Get all connected users

Auth: bearerAuth

Request parameters:
None

Request body:
None

Responses:
### 200
Description: List of connected users
Type: object
Body:
  - totalConnectedUsers: number
  - connectedUserIds: array
    - items: string
Example response:
```json
{
  "totalConnectedUsers": 1,
  "connectedUserIds": [
    "string"
  ]
}
```

### 401
Unauthorized

### 500
Server error

---

## GET /api/notifications/status/{userId}
Tag: Notifications
Summary: Check if a user is connected

Auth: bearerAuth

Request parameters:
- userId (path) | type: string | required | User ID to check

Request body:
None

Responses:
### 200
Description: User connection status
Type: object
Body:
  - userId: string
  - isConnected: boolean
Example response:
```json
{
  "userId": "string",
  "isConnected": true
}
```

### 400
Invalid request

### 401
Unauthorized

### 500
Server error

---

## POST /api/notifications/disconnect/{userId}
Tag: Notifications
Summary: Disconnect a specific user

Auth: bearerAuth

Request parameters:
- userId (path) | type: string | required | User ID to disconnect

Request body:
None

Responses:
### 200
User disconnected successfully

### 400
Invalid request

### 401
Unauthorized

### 500
Server error

---

## GET /api/notifications/status
Tag: Notifications
Summary: Get notification service status

Auth: bearerAuth

Request parameters:
None

Request body:
None

Responses:
### 200
Description: Service status
Type: object
Body:
  - success: boolean
  - status: string
  - connectedUsers: number
  - timestamp: string
Example response:
```json
{
  "success": true,
  "status": "string",
  "connectedUsers": 1,
  "timestamp": "2026-05-27T00:00:00Z"
}
```

### 401
Unauthorized

### 500
Server error

---
