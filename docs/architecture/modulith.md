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
- Runtime read-port exports may live in `src/modules/<module>/public.read.ts` when a narrow service entrypoint avoids importing the full service graph.
- Public DTO and port types live in `src/modules/<module>/public.contracts.ts`.
- `src/modules/<module>/index.ts` re-exports those public files for discoverability.
- Private paths such as `src/modules/<module>/services/*` are module-internal.
- Model files must not import other model files. Cross-model associations are wired centrally.

## Application Ports

Cross-module service calls should exchange plain DTOs through public ports. A module should not hold another module's Sequelize `Model` instance unless that dependency is still part of the temporary compatibility surface.

Phase 4 leaf rule:

- `notification` and `ranking` must not import cross-module `public.models.ts`.
- `notification` publishes through command/realtime DTOs from `notification/public.contracts.ts`.
- `ranking` reads tournament/match/member data through read ports and owns only ranking models.
- Cross-module imports of private `contracts/*` or `ports/*` folders are forbidden; expose shared types through `public.contracts.ts`.
- `public.models.ts` remains for compatibility, but new leaf-module work should prefer `public.contracts.ts`, `public.read.ts`, or `public.services.ts`.

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
- `yarn check:ports`: leaf application-port boundary gate.
- `yarn madge:app`: app-level circular dependency gate.
- `yarn madge:orm`: full source circular dependency gate. Current accepted cap: 0.
- `yarn verify`: build + smoke + architecture + port + app-cycle + ORM-cycle gates.

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

Next hardening step: expand the `public.models.ts` ban beyond the `notification` and `ranking` leaves once the remaining core modules have stable read/write ports.
