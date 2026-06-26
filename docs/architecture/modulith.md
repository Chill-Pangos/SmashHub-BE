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

## Module Public APIs

The old flat folders (`src/controllers`, `src/services`, `src/models`, `src/routes`, `src/dto`) have been removed. Module-owned files under `src/modules` are now the only application source of truth.

New code should import from module public facades, not from another module's private folders.
Runtime code outside `src/modules` (middlewares, crons, utils, shared helpers) must also import module public APIs.
Runtime code outside `src/modules` must not import module models; use public read/write/contracts/services instead.

- Public model exports were removed; modules expose behavior through ports/contracts.
- Runtime service exports live in `src/modules/<module>/public.services.ts`.
- Runtime read-port exports may live in `src/modules/<module>/public.read.ts` when a narrow service entrypoint avoids importing the full service graph.
- Runtime write-port exports may live in `src/modules/<module>/public.write.ts` when command use-cases need a narrow public entrypoint.
- Runtime lifecycle/cron exports may live in `src/modules/<module>/public.runtime.ts` for app boot, middleware, and cron processes.
- Public DTO and port types live in `src/modules/<module>/public.contracts.ts`.
- `src/modules/<module>/index.ts` re-exports non-model public files for discoverability.
- Private paths such as `src/modules/<module>/services/*` are module-internal.
- Model files must not import other model files. Cross-model associations are wired centrally.

## Application Ports

Cross-module service calls should exchange plain DTOs through public ports. A module should not hold another module's Sequelize `Model` instance unless that dependency is still part of the temporary compatibility surface.

Leaf port rules:

- Modules must not import another module's models.
- `notification` publishes through command/realtime DTOs from `notification/public.contracts.ts`.
- `ranking` reads tournament/match/member data through read ports and owns only ranking models.
- `registration` reads user, ELO, category/tournament, and registration-window data through read ports.
- `identity` creates initial ELO through ranking write port and reads ELO/referee assignment through read ports.
- `tournament` reads registration participants/payments, identity user/role data, and competition schedule/standing data through read/write ports.
- `competition` reads tournament category/referee context, registration entries/members, and identity user views through read ports.
- Cross-module imports of private `contracts/*` or `ports/*` folders are forbidden; expose shared types through `public.contracts.ts`.
- `public.models.ts` files must not exist; model access stays module-internal or diagnostics-only.
- `src/controllers`, `src/services`, `src/models`, `src/routes`, and `src/dto` must not exist.
- Runtime outside modules must not import module models.
- Runtime outside modules must not import full `public.services.ts`; use `public.runtime.ts`, `public.read.ts`, `public.write.ts`, or `public.contracts.ts`.
- Module root `index.ts` files must not re-export model files.

## Runtime Wiring

- `src/modules/index.ts` creates the API router and delegates route registration to module descriptors.
- `src/config/database.ts` loads the explicit model list from `src/modules/model.registry.ts`.
- `src/modules/model.associations.ts` wires Sequelize associations after model registration.
- `src/modules/model.diagnostics.ts` owns ORM include-alias smoke probes that need direct model access.
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
- `yarn check:arch`: also blocks imports from removed flat folders, fails if those folders are recreated, and fails if `public.models.ts` files are recreated.
- `yarn check:arch`: also blocks module root re-exports of model files.
- `yarn check:arch`: also blocks runtime imports of full `public.services.ts`.
- `yarn check:ports`: application-port boundary gate.
- `yarn check:ports`: also blocks script imports of removed module `public.models.ts`; scripts use module diagnostics or public ports.
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

Next hardening step: shrink public service return types that still expose Sequelize models to controllers.
