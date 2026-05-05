# TECH: Technical Setup & Development Guide

## Environment Setup

### Prerequisites

- Node v20+
- npm v11+
- PostgreSQL 14+ (local or remote)
- MariaDB 10.5+ (local or remote)
- Redis 6+ (local or remote)

### Installation

```bash
cd Artivox-BE
npm install
cp .env.example .env
```

### .env File

```env
# Database URLs (both required)
DATABASE_URL_POSTGRES=postgresql://user:pass@localhost:5432/artivox
DATABASE_URL_MARIADB=mysql://user:pass@localhost:3306/artivox

# JWT Secret
JWT_SECRET=your_secret_key_here

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
HOST=localhost
NODE_ENV=development
```

## Development Commands

```bash
# Start dev server (nodemon watch mode)
npm run dev

# Generate Prisma clients (both schemas)
npm run prisma:generate

# Create/apply migrations (PostgreSQL)
npm run prisma:migrate

# Open Prisma Studio (database UI)
npm run prisma:studio

# Start production server
npm start
```

## Prisma Setup (Critical)

### Schema Generation Problem

Both schema.postgres.prisma and schema.mariadb.prisma define identical enums.
Running `npx prisma generate` loads both simultaneously → enum conflicts.

### Solution

`scripts/prisma-generate.js` runs each schema in isolated child processes.

**First Time Setup:**

```bash
npm run prisma:generate
# Generates: generated/postgres/ + generated/mariadb/
```

**Import Pattern:**

```javascript
const { prisma } = require("@libs/prisma");
```

### Both Database URLs Required

```env
DATABASE_URL_POSTGRES=...  # Required for schema.postgres.prisma
DATABASE_URL_MARIADB=...   # Required for schema.mariadb.prisma
```

Without both, generation fails.

## Project Structure

```
Artivox-BE/
├── src/
│   ├── controllers/
│   │   ├── collection.controller.js
│   │   ├── product.controller.js
│   │   ├── material.controller.js
│   │   ├── tool.controller.js
│   │   └── ...
│   ├── services/
│   │   ├── collection.service.js
│   │   ├── product.service.js
│   │   ├── material.service.js
│   │   ├── tool.service.js
│   │   └── auth.service.js
│   ├── routes/
│   │   ├── collection.route.js
│   │   ├── product.route.js
│   │   ├── material.route.js
│   │   ├── tool.route.js
│   │   ├── index.js
│   │   └── ...
│   ├── validators/
│   │   ├── collection.validator.js
│   │   ├── product.validator.js
│   │   └── ...
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validate.middleware.js
│   │   └── response.middleware.js
│   ├── config/
│   │   ├── app.js
│   │   ├── auth.js
│   │   └── constants.js
│   ├── libs/
│   │   ├── prisma.js
│   │   └── redis.js
│   └── utils/
│       ├── AppError.js
│       └── catchAsync.js
├── prisma/
│   ├── schema.postgres.prisma
│   ├── schema.mariadb.prisma
│   └── migrations/
├── scripts/
│   └── prisma-generate.js
├── memory-bank/
│   ├── ARCH.md
│   ├── STATE.md
│   ├── RULES.md
│   └── TECH.md
├── server.js
├── package.json
└── .env
```

## API Structure

### Base URL

```
http://localhost:3000/api/v1
```

### Collections

```
GET    /collections           # All collections
GET    /collections/:id       # Collection detail
```

### Products

```
GET    /products              # All products (with filters)
GET    /products/:id          # Product detail
```

### Materials

```
GET    /materials             # All material products
```

### Tools

```
GET    /tools                 # All tool products
```

### Authentication

```
POST   /auth/admin/login      # Admin login
POST   /auth/customer/register # Customer register
POST   /auth/customer/login    # Customer login
```

### Cart (Auth Required)

```
GET    /cart                  # Get customer's cart
POST   /cart/add              # Add to cart
PATCH  /cart/:id              # Update cart item
DELETE /cart/:id              # Remove from cart
```

### Orders (Auth Required)

```
POST   /orders                # Create order
GET    /orders/me             # Get my orders
POST   /orders/:id/cancel     # Cancel order
```

## Code Patterns

### Service Function

```javascript
// collection.service.js
const { prisma } = require("@libs/prisma");

/**
 * Fetch all active collections.
 */
async function getCollections() {
  return prisma.collection.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { getCollections };
```

### Controller Function

```javascript
// collection.controller.js
const AppError = require("@utils/AppError");
const collectionService = require("@services/collection.service");

/**
 * Fetch all collections.
 */
async function getCollections(req, res, next) {
  try {
    const data = await collectionService.getCollections();
    return res.success(data, "Collections fetched");
  } catch (error) {
    return next(error);
  }
}

module.exports = { getCollections };
```

### Route Definition

```javascript
// collection.route.js
const express = require("express");
const collectionController = require("@controllers/collection.controller");

const router = express.Router();

router.get("/", collectionController.getCollections);
router.get("/:id", collectionController.getCollectionDetail);

module.exports = router;
```

### Route Registration

```javascript
// routes/index.js
const express = require("express");
const collectionRoute = require("./collection.route");
const productRoute = require("./product.route");
const materialRoute = require("./material.route");
const toolRoute = require("./tool.route");

const router = express.Router();

router.use("/collections", collectionRoute);
router.use("/products", productRoute);
router.use("/materials", materialRoute);
router.use("/tools", toolRoute);

module.exports = router;
```

## Debugging

### Check Prisma Clients

```bash
npm run prisma:studio
# Opens database UI for inspection
```

### View Logs

```bash
# Server logs (morgan + console.log)
npm run dev
```

### Validate Syntax

```bash
node -c src/services/collection.service.js
node -c src/controllers/collection.controller.js
```

### Test Single Endpoint

```bash
curl http://localhost:3000/api/v1/collections
```

## Common Issues

### "Enum already exists"

**Cause**: Running `npx prisma generate` directly  
**Fix**: Use `npm run prisma:generate` instead

### "DATABASE_URL_POSTGRES not found"

**Cause**: Missing .env file  
**Fix**: `cp .env.example .env` and fill in values

### "Cannot find module @libs/prisma"

**Cause**: Module alias not loaded  
**Fix**: Ensure `require('module-alias/register')` is first line in server.js

### "RedisError: connect ECONNREFUSED"

**Cause**: Redis not running  
**Fix**: Start Redis: `redis-server`

## Performance Tips

- Use Prisma Studio to inspect slow queries
- Add `.select()` instead of `.include()` when possible
- Cache frequently accessed collections in Redis
- Index commonly filtered fields in database

## Deployment

- Set `NODE_ENV=production`
- Use PM2 for process management
- Configure NGINX for load balancing
- Use separate database URLs for prod/staging
