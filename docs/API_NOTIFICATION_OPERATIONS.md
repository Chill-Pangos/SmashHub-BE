# 📘 API Documentation - Notification Operations (Socket.IO)

Tài liệu này mô tả các API để **quản lý real-time notifications** sử dụng **Socket.IO** trong hệ thống tournaments.

> 📝 **Lưu ý quan trọng:**
>
> - Tất cả APIs đều yêu cầu **authentication** (Bearer Token)
> - Sử dụng **Socket.IO** cho real-time communication
> - Hỗ trợ gửi notifications đến **user cụ thể**, **room**, hoặc **broadcast**
> - Clients cần kết nối qua Socket.IO endpoint để nhận real-time notifications

---

## **Socket.IO Connection**

### **Connection URL**

```
ws://your-server:port/
```

### **Connection Example (Client-side)**

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "your-jwt-token",
  },
});

// Listen for notifications
socket.on("notification", (data) => {
  console.log("Received notification:", data);
});

// Listen for custom events
socket.on("match_update", (data) => {
  console.log("Match updated:", data);
});

// Join a room (e.g., tournament room)
socket.emit("join_room", { roomId: "tournament_1" });
```

### **Common Events**

| Event              | Direction       | Description                  |
| ------------------ | --------------- | ---------------------------- |
| `notification`     | Server → Client | General notification message |
| `match_update`     | Server → Client | Match status/score updated   |
| `tournament_start` | Server → Client | Tournament has started       |
| `schedule_change`  | Server → Client | Schedule has been modified   |
| `join_room`        | Client → Server | Join a specific room         |
| `leave_room`       | Client → Server | Leave a specific room        |

---

## **Table of Contents**

1. [Send Notification](#1-send-notification)
2. [Send Custom Event](#2-send-custom-event)
3. [Get Connected Users](#3-get-connected-users)
4. [Check User Connection Status](#4-check-user-connection-status)
5. [Disconnect User](#5-disconnect-user)
6. [Get Service Status](#6-get-service-status)

---

## **1. Send Notification**

### **Endpoint**

```
POST /api/notifications/send
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Gửi notification đến user(s) hoặc room. Hỗ trợ các mode:

- **userId**: Gửi đến một user cụ thể
- **userIds**: Gửi đến nhiều users
- **roomId**: Gửi đến tất cả users trong room
- **broadcast**: Gửi đến tất cả users đang kết nối

### **Request Body**

| Field       | Type     | Required | Description                                              |
| ----------- | -------- | -------- | -------------------------------------------------------- |
| `type`      | string   | Yes      | Loại notification (match_update, tournament_start, etc.) |
| `title`     | string   | Yes      | Tiêu đề notification                                     |
| `message`   | string   | Yes      | Nội dung notification                                    |
| `userId`    | string   | No\*     | Gửi đến user ID cụ thể                                   |
| `userIds`   | string[] | No\*     | Gửi đến nhiều user IDs                                   |
| `roomId`    | string   | No\*     | Gửi đến room ID                                          |
| `broadcast` | boolean  | No\*     | Broadcast đến tất cả users                               |
| `data`      | object   | No       | Additional data payload                                  |

> \*Phải cung cấp ít nhất một trong: `userId`, `userIds`, `roomId`, hoặc `broadcast`

### **Request Example - Send to User**

```json
{
  "userId": "123",
  "type": "match_update",
  "title": "Trận đấu sắp bắt đầu",
  "message": "Trận đấu của bạn sẽ bắt đầu trong 10 phút tại bàn số 5",
  "data": {
    "matchId": 45,
    "tableNumber": 5
  }
}
```

### **Request Example - Broadcast**

```json
{
  "broadcast": true,
  "type": "tournament_start",
  "title": "Giải đấu bắt đầu",
  "message": "Giải vô địch cầu lông toàn quốc 2024 chính thức bắt đầu!"
}
```

### **Request Example - Send to Room**

```json
{
  "roomId": "tournament_1",
  "type": "schedule_change",
  "title": "Thay đổi lịch thi đấu",
  "message": "Lịch thi đấu ngày mai đã được cập nhật",
  "data": {
    "tournamentId": 1,
    "affectedDate": "2024-06-15"
  }
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "recipients": 25,
    "type": "tournament_start"
  }
}
```

### **Error Responses**

**400 Bad Request - Missing target**

```json
{
  "success": false,
  "message": "Must specify userId, userIds, roomId, or broadcast"
}
```

---

## **2. Send Custom Event**

### **Endpoint**

```
POST /api/notifications/event
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Gửi custom event đến user hoặc room. Dùng khi cần gửi event với tên tùy chỉnh thay vì notification chuẩn.

**Use cases:**

- Real-time score updates
- Match status changes
- Live bracket updates

### **Request Body**

| Field    | Type   | Required | Description            |
| -------- | ------ | -------- | ---------------------- |
| `event`  | string | Yes      | Tên event              |
| `data`   | object | Yes      | Data payload           |
| `userId` | string | No\*     | Gửi đến user ID cụ thể |
| `roomId` | string | No\*     | Gửi đến room ID        |

> \*Phải cung cấp `userId` hoặc `roomId`

### **Request Example**

```json
{
  "roomId": "match_45",
  "event": "score_update",
  "data": {
    "matchId": 45,
    "setNumber": 2,
    "entryAScore": 8,
    "entryBScore": 6
  }
}
```

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "Event 'score_update' sent successfully"
}
```

---

## **3. Get Connected Users**

### **Endpoint**

```
GET /api/notifications/connected-users
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Lấy danh sách tất cả users đang kết nối qua Socket.IO.

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "totalConnectedUsers": 42,
    "connectedUserIds": ["123", "456", "789"]
  }
}
```

---

## **4. Check User Connection Status**

### **Endpoint**

```
GET /api/notifications/status/{userId}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Kiểm tra xem một user có đang kết nối qua Socket.IO hay không.

### **Path Parameters**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `userId`  | string | Yes      | User ID     |

### **Response - 200 OK**

```json
{
  "success": true,
  "data": {
    "userId": "123",
    "isConnected": true
  }
}
```

---

## **5. Disconnect User**

### **Endpoint**

```
POST /api/notifications/disconnect/{userId}
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Ngắt kết nối Socket.IO của một user. Dùng trong trường hợp cần force logout hoặc xử lý security issues.

### **Path Parameters**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `userId`  | string | Yes      | User ID     |

### **Response - 200 OK**

```json
{
  "success": true,
  "message": "User 123 disconnected successfully"
}
```

### **Error Responses**

**404 Not Found - User not connected**

```json
{
  "success": false,
  "message": "User 123 is not connected"
}
```

---

## **6. Get Service Status**

### **Endpoint**

```
GET /api/notifications/status
```

### **Authentication**

✅ **Required** - Bearer Token

### **Description**

Kiểm tra trạng thái của notification service.

### **Response - 200 OK**

```json
{
  "success": true,
  "status": "healthy",
  "connectedUsers": 42,
  "timestamp": "2024-06-15T10:30:00.000Z"
}
```

---

## **TypeScript Interfaces**

```typescript
// Send Notification Request
interface SendNotificationRequest {
  userId?: string;
  userIds?: string[];
  roomId?: string;
  broadcast?: boolean;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// Send Event Request
interface SendEventRequest {
  userId?: string;
  roomId?: string;
  event: string;
  data: Record<string, any>;
}

// Notification Payload (received by client)
interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

// Service Status Response
interface ServiceStatusResponse {
  success: boolean;
  status: "healthy" | "degraded" | "down";
  connectedUsers: number;
  timestamp: string;
}
```

---

## **Client Integration Example**

### **React Hook for Notifications**

```typescript
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useNotifications = (token: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL, {
      auth: { token },
    });

    newSocket.on("notification", (notification: NotificationPayload) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    newSocket.on("connect", () => {
      console.log("Connected to notification service");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from notification service");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinRoom = (roomId: string) => {
    socket?.emit("join_room", { roomId });
  };

  const leaveRoom = (roomId: string) => {
    socket?.emit("leave_room", { roomId });
  };

  return { socket, notifications, joinRoom, leaveRoom };
};
```

---

## **Common Notification Types**

| Type               | Description                  | When to use                     |
| ------------------ | ---------------------------- | ------------------------------- |
| `match_update`     | Cập nhật trạng thái trận đấu | Match start, end, score update  |
| `tournament_start` | Giải đấu bắt đầu             | Tournament officially begins    |
| `tournament_end`   | Giải đấu kết thúc            | Tournament ends                 |
| `schedule_change`  | Thay đổi lịch thi đấu        | Schedule modified               |
| `bracket_update`   | Cập nhật nhánh đấu           | Bracket generated or updated    |
| `reminder`         | Nhắc nhở                     | Upcoming match reminder         |
| `announcement`     | Thông báo chung              | General announcements           |
| `referee_assigned` | Phân công trọng tài          | Referee assignment notification |
