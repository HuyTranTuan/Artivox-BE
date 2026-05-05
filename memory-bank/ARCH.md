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
└── utils/             # AppError, helpers
```

## Request Lifecycle

```
Route → Middleware → Validator(if needs) → Controller → Service → Prisma/Redis(if needs Redis) → Response
```

## Entities

- **Collection**: Groups of 3D models
- **Product**: Base entity (sku, price, stock, type)
- **Model3D**: 3D printable model (linked to Product)
- **Material**: FDM/SLA filament (linked to Product)
- **Tool**: Post-processing tools (linked to Product)
- **User**: Admin/staff with permissions
- **Customer**: E-commerce users with cart/orders
- **Order**: Purchase with items, status tracking
- **Article**: Multi-language blog content

## Key Patterns

- **Soft Delete**: Most tables have `deletedAt` (except Order for audit)
- **Polymorphic Products**: One product → one of (Model3D, Material, Tool)
- **Multi-Language**: Article + ArticleTranslation tables
- **Status Tracking**: Order statuses (PENDING → PAID → REFUND_PENDING → REFUNDED)

## Known Issues & Solutions

- **Prisma v6 Enum Conflict**: Dual schemas cause namespace collision
  - **Fix**: `scripts/prisma-generate.js` runs generation in isolated processes
  - **Usage**: `npm run prisma:generate` (never `npx prisma generate`)
  - **Critical**: @prisma/client version must match prisma CLI version (both v6.19.3+)
