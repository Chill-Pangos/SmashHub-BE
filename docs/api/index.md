# SmashHub API

API documentation for SmashHub - Tournament Management System

Version: 1.0.0
Base path: /api

## Tags

- [Auth](auth.md) - Authentication and token lifecycle endpoints (11 endpoints)
- [ELO Histories](elo-histories.md) - ELO history tracking endpoints (6 endpoints)
- [ELO Scores](elo-scores.md) - ELO scoring system endpoints (6 endpoints)
- [Entries](entries.md) - Entry management endpoints (22 endpoints)
- [Group Standings](group-standings.md) - Group stage standings endpoints (7 endpoints)
- [Knockout Brackets](knockout-brackets.md) - Knockout bracket management endpoints (7 endpoints)
- [Match Sets](match-sets.md) - Match set endpoints (5 endpoints)
- [Matches](matches.md) - Match management endpoints (16 endpoints)
- [Notifications](notifications.md) - Real-time notification management endpoints (6 endpoints)
- [Payments](payments.md) - Payment and payout endpoints (12 endpoints)
- [Permissions](permissions.md) - Permission management endpoints (5 endpoints)
- [Role Permissions](role-permissions.md) - Role-permission mapping endpoints (6 endpoints)
- [Roles](roles.md) - Role management endpoints (6 endpoints)
- [Schedule Config](schedule-config.md) - Schedule configuration endpoints (8 endpoints)
- [Schedules](schedules.md) - Schedule management endpoints (12 endpoints)
- [Sub Match Players](sub-match-players.md) - Sub-match player assignment endpoints (3 endpoints)
- [Sub Matches](sub-matches.md) - Sub-match management endpoints (6 endpoints)
- [Tournament Categories](tournament-categories.md) - Tournament category endpoints (6 endpoints)
- [Tournament Referees](tournament-referees.md) - Tournament referee assignment endpoints (9 endpoints)
- [Tournaments](tournaments.md) - Tournament management endpoints (10 endpoints)
- [User Roles](user-roles.md) - User-role mapping endpoints (6 endpoints)
- [Users](users.md) - User management endpoints (7 endpoints)

## Notes

- Methods, endpoints, request bodies, and responses are extracted from Swagger annotations in `src/routes/*.ts`.
- Field types, enums, and defaults are merged from Swagger component schemas in `src/config/swagger.ts` and `src/docs/swagger.annotations.ts`.
- Example responses are generated from documented examples when present, otherwise derived from schema defaults and enum values.
