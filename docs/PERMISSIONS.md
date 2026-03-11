# Permission System Documentation

## Overview

The SmashHub BE uses a role-based access control (RBAC) system with permissions. Users are assigned roles, and each role has specific permissions.

## Roles

- **admin**: Full system access
- **organizer**: Tournament and event management
- **chief_referee**: Match result approval and referee management
- **referee**: Match management and reporting
- **coach**: Team and player management
- **team_manager**: Team operations
- **athlete**: View and participate
- **spectator**: Read-only access

## Setup

### 1. Run Permission Seeds

```bash
# Connect to your MySQL database and run:
mysql -u your_user -p your_database < database/seeds/permissions.sql
```

This will:
- Create all permissions
- Assign permissions to appropriate roles

### 2. Permissions List

```typescript
// User Management
users.view
users.create
users.update
users.delete

// Tournament Management
tournaments.view
tournaments.create
tournaments.update
tournaments.delete
tournaments.manage

// Match Management
matches.view
matches.create
matches.update
matches.delete
matches.start
matches.report_result
matches.approve_result

// Schedule Management
schedules.view
schedules.create
schedules.update
schedules.delete

// Entry Management
entries.view
entries.create
entries.update
entries.delete
entries.approve

// Team Management
teams.view
teams.create
teams.update
teams.delete
teams.manage_members

// Complaint Management
complaints.view
complaints.create
complaints.update
complaints.resolve
complaints.assign

// ELO Management
elo.view
elo.manage

// Role & Permission Management
roles.view
roles.create
roles.update
roles.delete
permissions.view
permissions.manage

// Notification Management
notifications.view
notifications.send

// Content Management
content.view
content.create
content.update
content.delete
```

## Usage in Routes

### Import Middleware

```typescript
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission, checkAnyPermission, checkAllPermissions, checkRole } from "../middlewares/permission.middleware";
import { PERMISSIONS, ROLES } from "../constants/permissions";
```

### Single Permission Check

```typescript
router.post("/tournaments",
  authenticate,
  checkPermission(PERMISSIONS.TOURNAMENTS_CREATE),
  tournamentController.create
);
```

### Multiple Permissions (Any)

User needs at least ONE of the specified permissions:

```typescript
router.get("/matches/pending",
  authenticate,
  checkAnyPermission([
    PERMISSIONS.MATCHES_APPROVE_RESULT,
    PERMISSIONS.MATCHES_UPDATE
  ]),
  matchController.findPendingMatches
);
```

### Multiple Permissions (All)

User needs ALL specified permissions:

```typescript
router.post("/matches/:id/approve",
  authenticate,
  checkAllPermissions([
    PERMISSIONS.MATCHES_VIEW,
    PERMISSIONS.MATCHES_APPROVE_RESULT
  ]),
  matchController.approveMatchResult
);
```

### Role Check

```typescript
// Single role
router.get("/admin/dashboard",
  authenticate,
  checkRole(ROLES.ADMIN),
  adminController.dashboard
);

// Multiple roles
router.get("/referee/matches",
  authenticate,
  checkRole([ROLES.REFEREE, ROLES.CHIEF_REFEREE]),
  matchController.getRefereeMatches
);
```

## Permission Matrix

| Permission | Admin | Organizer | Chief Referee | Referee | Coach | Team Manager | Athlete | Spectator |
|-----------|-------|-----------|---------------|---------|-------|--------------|---------|-----------|
| tournaments.create | ✓ | ✓ | - | - | - | - | - | - |
| matches.start | ✓ | ✓ | - | ✓ | - | - | - | - |
| matches.report_result | ✓ | ✓ | - | ✓ | - | - | - | - |
| matches.approve_result | ✓ | - | ✓ | - | - | - | - | - |
| teams.manage_members | ✓ | - | - | - | ✓ | ✓ | - | - |
| elo.manage | ✓ | - | - | - | - | - | - | - |

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Permission denied. Required: tournaments.create"
}
```

## Examples

### Protected Route Example

```typescript
// routes/tournament.routes.ts
import { Router } from "express";
import tournamentController from "../controllers/tournament.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

// Public - anyone can view
router.get("/", tournamentController.findAll);

// Protected - requires authentication and permission
router.post("/",
  authenticate,
  checkPermission(PERMISSIONS.TOURNAMENTS_CREATE),
  tournamentController.create
);

router.put("/:id",
  authenticate,
  checkPermission(PERMISSIONS.TOURNAMENTS_UPDATE),
  tournamentController.update
);

router.delete("/:id",
  authenticate,
  checkPermission(PERMISSIONS.TOURNAMENTS_DELETE),
  tournamentController.delete
);

export default router;
```

### Testing with Postman/Curl

1. Login to get token:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "organizer001@smashhub.com", "password": "Password123!"}'
```

2. Use token in protected routes:
```bash
curl -X POST http://localhost:3000/api/tournaments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Tournament", "startDate": "2026-05-01", "location": "Stadium"}'
```

## Notes

- Authentication (`authenticate`) must always come before permission checks
- Public routes don't need any middleware
- Admin role has all permissions by default
- Permissions are checked at database level, not cached
- Use constants from `PERMISSIONS` object for type safety
