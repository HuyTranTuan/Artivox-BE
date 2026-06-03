# Active Context

**Updated:** Jun 4, 2026

## Current Focus

- All core features implemented and stable
- Chat: customer support + internal staff-to-staff + AI standalone
- Order payment status update endpoint added

## Hot Paths

- `src/routes/index.js` — route registration
- `src/routes/chat.route.js` — room claim, internal chat
- `src/controllers/chat.controller.js` — largest controller (12KB)
- `src/controllers/admin.controller.js` — dashboard, revenue
- `src/services/*.service.js` — business logic
- `src/middlewares/auth.middleware.js` — authMiddleware, restrictTo, optionalAuth

## Rules

- Route → controller → service → Prisma (CommonJS)
- Soft delete: `deletedAt: null`
- Controllers thin — logic in services
- Use `@` aliases from `jsconfig.json`
- Rate limiting on auth routes via `authLimiter`
- Cache middleware: `cacheMiddleware(key, ttl)` on GET catalog routes

## Base API

- Dev: `http://localhost:3000/api`
- Catalog list params: `?search=&limit=10&skip=0&isActive=true`

## Next Tasks

- Performance: audit slow queries
- Deployment prep
