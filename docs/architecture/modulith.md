# SmashHub Backend Modulith

## Module Map

The backend is organized as a modular monolith under `src/modules`.

- `identity`: authentication, users, roles, permissions, tokens, OTP, email auth flows.
- `tournament`: tournaments, categories, referee assignment/invitations, tournament status notifications.
- `registration`: entries, entry members, join requests, payments.
- `competition`: schedules, schedule configs, matches, sub-matches, match sets, group standings, knockout brackets.
- `ranking`: ELO scores, ELO histories, tournament ELO calculation.
- `notification`: notification inbox, Socket.IO realtime delivery, notification templates.
- `admin`: system health, runtime metrics, cron logs, audit logs.

## Compatibility Layer

The old flat folders (`src/controllers`, `src/services`, `src/models`, `src/routes`, `src/dto`) now act as compatibility facades. They re-export module-owned files so existing imports keep working while the rest of the code is migrated to module public APIs.

New code should import from module public facades, not from another module's private folders.

- Runtime model exports live in `src/modules/<module>/public.models.ts`.
- Runtime service exports live in `src/modules/<module>/public.services.ts`.
- `src/modules/<module>/index.ts` re-exports those public files for discoverability.
- Private paths such as `src/modules/<module>/services/*` are module-internal.
- Sequelize model association imports are the only documented exception while decorators remain in model classes.

## Runtime Wiring

- `src/routes/index.ts` delegates route registration to `src/modules`.
- `src/config/database.ts` loads Sequelize models from `src/modules/**/*.model.{js,ts}`.
- Existing API paths stay unchanged under `/api`.
- PM2 app/cron split stays unchanged.

## Current Guardrails

- `yarn build`: TypeScript compile gate.
- `yarn smoke:routes`: route import smoke gate.
- `yarn check:arch`: module boundary gate.
- `yarn madge:app`: app-level circular dependency gate, excluding ORM model decorators.
- `yarn madge:orm`: ORM cycle budget gate. Current accepted cap: 27.
- `yarn verify`: build + smoke + architecture + app-cycle gates.

Route import smoke check:

```sh
yarn smoke:routes
```

## Domain Events

`src/shared/events/domainEvent.bus.ts` provides the in-process domain event bus. Handler failures are logged and do not roll back the caller.

Current events:

- `cronLog.created`: realtime cron log publish + admin system event.
- `auditLog.created`: admin audit realtime event.

Admin event handlers are registered by `src/modules/admin/admin.events.ts`. `CronLogService` also registers them before publishing so the cron process gets handlers even when HTTP routes are not loaded.

## Known Follow-Up

Sequelize decorators still create circular imports between associated models. This existed before the modulith move. `yarn madge:orm` keeps the debt bounded while `yarn madge:app` enforces zero app-level cycles.

Next hardening step: move association wiring out of model class imports, then lower the ORM cycle cap.
