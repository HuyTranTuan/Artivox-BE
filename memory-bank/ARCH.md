# ARCH: Artivox Backend v1

## Overview

E-commerce platform for 3D printing: models, materials, tools.
Dual-database: PostgreSQL (primary), MariaDB (fallback).

## Tech Stack

- **Runtime**: Node v20+, CommonJS only
- **Framework**: Express.js
- **ORM**: Prisma v7 (dual-schema generation)
- **Cache**: Redis
- **Auth**: JWT + Bcrypt
- **Validation**: Zod
- **Aliases**: module-alias (@, @controllers, @services, etc.)

## Database

- **Dual-Schema**: schema.postgres.prisma + schema.mariadb.prisma
- **Generated**: generated/postgres + generated/mariadb (separate clients)
- **Prisma Script**: scripts/prisma-generate.js (isolated process generation)

## Project Structure

```
src/
├── commands/          # CLI scripts
├── config/            # Env, constants, DB init
├── libs/              # Prisma clients, Redis
├── controllers/       # Request handlers (thin layer)
├── services/          # Business logic (core)
├── routes/            # Endpoint definitions
├── middlewares/       # Auth, error, validation
├── validators/        # Zod schemas
└── utils/             # helpers
```

## Request Lifecycle

```
Route → Middleware → Validator(if needs) → Controller → Service → Prisma/Redis(if needs Redis) → Response
```

## Entities

- **Collection**: Groups of 3D models
- **Product**: Base entity (sku, price, stock, type) — polymorphic: MODEL / MATERIAL / TOOL
- **Model3D**: 3D printable model (linked to Product via model_3d table)
- **Material**: FDM/SLA filament (linked to Product via materials table)
- **Tool**: Post-processing tools (linked to Product via tools table)
- **AdminUser**: Admin/staff with permissions
- **Customer**: E-commerce users with cart/orders
- **Order**: Purchase with items (order_items table), status tracking
- **Discount**: Promo codes with value, min amount, expiry
- **DiscountOrder**: Applied discount records linked to orders
- **Article**: Multi-language blog content (ArticleTranslation table with locale vi/en)
- **ChatRoom**: Support chat between admin and customer
- **ChatMessage**: Messages within chat rooms
- **CustomerActivityLog**: Audit trail for customer actions

## Key Patterns

- **Soft Delete**: Most tables have `deletedAt` (except Order, DiscountOrder for audit)
- **Polymorphic Products**: One product → one of (Model3D, Material, Tool) — queried by `type` enum
- **Multi-Language**: Article + ArticleTranslation tables (locales: vi, en)
- **Status Tracking**: Order statuses (PENDING → COMPLETED / CANCELED)
- **Payment Tracking**: Payment status (PENDING, PAID, REFUNDED, REFUNDING, FAILED)
- **Module Aliases**: All imports use `@` prefixed aliases (e.g., `@services/product.service`)

## Route Organization

```
routes/
├── index.js              # Aggregates all route groups
├── catalog.route.js      # Collections, products, models, materials, tools
├── auth.route.js         # Admin login, customer register/login, refresh token
├── article.route.js      # Articles with locale support (vi/en)
├── cart.route.js         # Customer cart (auth required)
├── order.route.js        # Public orders + customer orders (auth)
├── customer.route.js     # Customer listing (public)
├── discount.route.js     # Discount listing (public)
├── discountOrder.route.js# Discount order records (public)
├── customerActivityLog.route.js # Activity logs (auth required)
├── admin.route.js        # Admin CRUD
├── chat.route.js         # Chat system
├── collection.route.js   # Collection CRUD
├── material.route.js     # Materials + slug detail
├── models.route.js       # Models (type=MODEL) + slug detail
├── product.route.js      # Products with filter/search
└── tool.route.js         # Tools + slug detail
```

## Service/Controller Per Resource Pattern

Every resource follows the same pattern:

1. **Service** (`src/services/*.service.js`) — Prisma queries, business logic
2. **Controller** (`src/controllers/*.controller.js`) — catchAsync wrapper, request handling
3. **Route** (`src/routes/*.route.js`) — Express router with middleware binding

## Known Issues & Solutions

- **Prisma v6 Enum Conflict**: Dual schemas cause namespace collision
  - **Fix**: `scripts/prisma-generate.js` runs generation in isolated processes
  - **Usage**: `npm run prisma:generate` (never `npx prisma generate`)
  - **Critical**: @prisma/client version must match prisma CLI version (both v6.19.3+)
