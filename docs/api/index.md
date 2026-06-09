# SmashHub API

API documentation for SmashHub - Tournament Management System

Version: 1.0.0
Base path: /api

## Tags

- [Auth](auth.md) - Authentication and authorization endpoints (11 endpoints)
- [ELO Histories](elo-histories.md) - ELO history tracking endpoints (2 endpoints)
- [ELO Scores](elo-scores.md) - ELO scoring system endpoints (1 endpoints)
- [Entries](entries.md) - Entry management endpoints (14 endpoints)
- [Entry Members](entry-members.md) -  (6 endpoints)
- [Group Standings](group-standings.md) - Group stage standing management endpoints (6 endpoints)
- [Knockout Brackets](knockout-brackets.md) - Knockout bracket management endpoints (9 endpoints)
- [Match Sets](match-sets.md) - Match set endpoints (8 endpoints)
- [Matches](matches.md) - Match management endpoints (8 endpoints)
- [Notifications](notifications.md) - Real-time notifications endpoints (6 endpoints)
- [Payments](payments.md) - Payment and entry fee management endpoints (12 endpoints)
- [Permissions](permissions.md) - Permission management endpoints (5 endpoints)
- [Role Permissions](role-permissions.md) - Role permission assignment endpoints (6 endpoints)
- [Roles](roles.md) - Role management endpoints (6 endpoints)
- [Schedule Config](schedule-config.md) - Schedule configuration endpoints (8 endpoints)
- [Schedules](schedules.md) - Schedule management endpoints (8 endpoints)
- [Sub Match Players](sub-match-players.md) - Sub-match player assignment endpoints (3 endpoints)
- [Sub Matches](sub-matches.md) - Sub-match management endpoints (6 endpoints)
- [Tournament Categories](tournament-categories.md) - Tournament category endpoints (6 endpoints)
- [Tournament Referees](tournament-referees.md) - Tournament referee management endpoints (10 endpoints)
- [Tournaments](tournaments.md) - Tournament management endpoints (10 endpoints)
- [User Roles](user-roles.md) - User role assignment endpoints (6 endpoints)
- [Users](users.md) - User management endpoints (8 endpoints)

## Notes

- Methods, endpoints, request bodies, and responses are extracted from Swagger annotations in `src/routes/*.ts`.
- Field types, enums, and defaults are merged from Swagger component schemas in `src/config/swagger.ts` and `src/docs/swagger.annotations.ts`.
- Example responses are generated from documented examples when present, otherwise derived from schema defaults and enum values.
