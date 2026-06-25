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
- Model files must not import other model files. Cross-model associations are wired centrally.

## Runtime Wiring

- `src/routes/index.ts` delegates route registration to `src/modules`.
- `src/config/database.ts` loads the explicit model list from `src/modules/model.registry.ts`.
- `src/modules/model.associations.ts` wires Sequelize associations after model registration.
- Existing API paths stay unchanged under `/api`.
- PM2 app/cron split stays unchanged.

## ORM Associations

Model classes own table columns, validators, constants, and lightweight association property declarations. They do not own association decorators or cross-model imports.

Association rules:

- Add every model to `src/modules/model.registry.ts`.
- Add every `belongsTo`, `hasOne`, `hasMany`, or `belongsToMany` call to `src/modules/model.associations.ts`.
- Always preserve explicit `as` aliases used by services, especially multi-FK relations such as `entryA`, `entryB`, `winnerEntry`, `umpire`, `assistantUmpire`, `referee`, and `inviter`.
- Keep enum/constants that are shared by multiple models in non-model helper files such as `*.constants.ts`.

## Current Guardrails

- `yarn build`: TypeScript compile gate.
- `yarn smoke:routes`: route import smoke gate.
- `yarn check:arch`: module boundary gate.
- `yarn madge:app`: app-level circular dependency gate.
- `yarn madge:orm`: full source circular dependency gate. Current accepted cap: 0.
- `yarn verify`: build + smoke + architecture + app-cycle + ORM-cycle gates.

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

ORM circular import debt is removed and bounded by `yarn madge:orm` at zero.

Next hardening step: introduce repository/application ports per module so cross-module services depend on stable use-case APIs instead of runtime models. Good first extraction candidates are `notification` and `ranking`.
