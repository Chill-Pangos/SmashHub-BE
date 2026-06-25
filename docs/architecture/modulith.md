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

New code should import from `src/modules/<module>` or from a module facade, not from another module's private folders. Cross-module access should go through public service/facade exports.

## Runtime Wiring

- `src/routes/index.ts` delegates route registration to `src/modules`.
- `src/config/database.ts` loads Sequelize models from `src/modules/**/*.model.{js,ts}`.
- Existing API paths stay unchanged under `/api`.
- PM2 app/cron split stays unchanged.

## Current Guardrails

- `yarn build` must pass after every phase.
- Route import smoke check:

```sh
node -e "require('./dist/routes').default; console.log('routes ok')"
```

## Known Follow-Up

Sequelize decorators still create circular imports between associated models. This existed before the modulith move and remains visible in `madge --circular --extensions ts src`. Next hardening step: move association wiring out of model class imports or configure an architecture check that ignores known Sequelize association edges while enforcing module-boundary imports.

