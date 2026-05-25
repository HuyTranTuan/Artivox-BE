# Active Context

## Project

Artivox-BE backend.

- Node.js + Express
- Prisma + PostgreSQL
- JWT auth
- Zod validation
- Socket.io

## Current Focus

- Stabilize catalog GET routes under `/api/v1/catalog/*`
- Keep list endpoints consistent with `search`, `limit`, `skip`
- Enforce small-page pagination for catalog resources
- Clean stale memory-bank notes and backend rules

## Hot Paths

- `src/routes/index.js`
- `src/routes/catalog.route.js`
- `src/routes/article.route.js`
- `src/controllers/*.controller.js`
- `src/services/*.service.js`
- `src/validators/*.validator.js`
- `src/middlewares/response.middleware.js`

## Current Backend Rules

- Route -> middleware -> controller -> service -> Prisma
- Use CommonJS only
- Use aliases from `jsconfig.json`
- Soft delete filter: `deletedAt: null`
- Keep controllers thin
- Put business logic in services

## Next Tasks

- Verify catalog list routes return valid paginated data
- Fix any route mount mismatch causing 404
- Clean broken validators without changing unrelated logic
- Audit memory-bank files for stale FE content
- Keep `RULES.md`, `STATE.md`, `ARCH.md` aligned

## Known Risks

- `catalog.validator.js` is stale/broken
- Memory-bank had FE notes inside BE project
- State docs mention pending schema and search work

## Notes

- Base API: `http://localhost:3000/api/v1`
- Catalog list target:
  - `/catalog/collections?search=&limit=10&skip=0`
  - `/catalog/models?search=&limit=10&skip=0`
  - `/catalog/materials?search=&limit=10&skip=0`
  - `/catalog/tools?search=&limit=10&skip=0`
