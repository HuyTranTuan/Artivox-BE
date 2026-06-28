# STATE: ARTIVOX BACKEND

**Updated:** Jun 29, 2026 | **Status:** ✅ PRODUCTION READY

## Features Complete

| Feature | Status | Notes |
|---|---|---|
| Auth | ✅ | JWT, register, login, logout, refresh, email verify, Google OAuth, password reset |
| Catalog | ✅ | Models, Materials, Tools, Products, Collections — full CRUD + search/filter |
| Orders | ✅ | Create, approve, cancel, payment-status update |
| Articles | ✅ | Multi-lang (en/vi), versioning, approve, locale routes |
| Chat | ✅ | Customer support rooms (claim), AI chat, internal staff-to-staff rooms, file upload |
| Notifications | ✅ | 5 types, socket emit, CRUD |
| Discounts | ✅ | CRUD + admin list |
| Search | ✅ | Global + per-type (models/materials/tools) |
| Admin | ✅ | Dashboard, staff dashboard, user management, revenue |
| Locations | ✅ | Provinces, wards |
| Security | ✅ | JWT, bcrypt, Zod validation, CORS, rate limiting |
| Mail | ✅ | Nodemailer (verify email) |
| Cron | ✅ | pg_dump → Google Drive daily 3AM |
| AI | ✅ | OpenAI/Groq/OpenRouter multi-key resolution |
| Cart Cache | ✅ | Redis cache layer: `cart:{customerId}` TTL 1h, invalidate on all writes, fallback to Prisma |

## Routes Summary

- `/auth` — customer + admin auth
- `/admin` — admin/staff management, dashboard, revenue
- `/catalog/models|materials|tools|products|collections` — catalog CRUD
- `/cart` — user cart
- `/orders` — order lifecycle
- `/articles` — blog/CMS
- `/chat` — rooms, messages, AI, internal
- `/discounts` — discount campaigns
- `/discount_orders` — discount order records
- `/notifications` — notification CRUD
- `/search` — global + typed search
- `/customers` — customer lookup
- `/customer-activity-log` — activity logs
- `/location` — provinces, wards

## Recent Changes (Jun 29, 2026)

- `cart.service.js`: Redis cache-first layer added. Key: `cart:{customerId}`, TTL 1h. All writes (`addToCart`, `updateCartItem`, `removeFromCart`) call `invalidateCache`. Graceful fallback if Redis unavailable.

## Stack

- Node.js + Express (CommonJS)
- Prisma + PostgreSQL
- Redis (cache)
- Socket.io (chat + notifications)
- Zod (validation)
- JWT (auth)
- Cloudflare R2 (image storage)
- Nodemailer (email)

## Rules

- Route → middleware → controller → service → Prisma
- Soft delete: `deletedAt: null`
- Controllers thin — business logic in services
- CommonJS only
- Aliases from `jsconfig.json`
