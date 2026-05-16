# TECH: Technology Stack & Setup

## Stack Overview

| Layer      | Technology   | Version |
| ---------- | ------------ | ------- |
| Runtime    | Node.js      | 20+     |
| Framework  | Express.js   | 4.x     |
| Database   | PostgreSQL   | 14+     |
| ORM        | Prisma       | 7.x     |
| Cache      | Redis        | 6+      |
| Auth       | JWT + Bcrypt | -       |
| Validation | Zod          | 3.x     |
| Real-time  | Socket.io    | 4.x     |

## Environment Setup

### Required

- Node v20+
- PostgreSQL 14+
- Redis 6+

### .env Configuration

```env
DATABASE_URL_POSTGRES=postgresql://user:pass@localhost:5432/artivox
JWT_SECRET=your_secret_key
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
```

## Project Structure

```
src/
├── config/          # Constants, CORS, auth config
├── controllers/     # Thin request handlers
├── services/        # Business logic (core)
├── routes/          # Express routes
├── middlewares/     # Auth, validation, error
├── validators/      # Zod schemas
└── utils/           # Helpers
```

## Key Commands

```bash
npm run dev              # Start with nodemon
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm start              # Production server
```

## Database Patterns

- **Soft Delete:** deletedAt !== null
- **Timestamps:** createdAt, updatedAt auto-managed
- **Polymorphic:** Product type = MODEL|MATERIAL|TOOL
- **Multi-lang:** ArticleTranslation with locale

## Request Lifecycle

```
Route → Auth Middleware → Validation → Controller → Service → Prisma → Response
```

## Error Handling

All errors flow through error.middleware.js with consistent format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description"
}
```

## Notification System

- 5 auto-trigger types (ORDER_CREATED, ORDER_APPROVED, ARTICLE_CREATED, ARTICLE_APPROVED, CHAT_MESSAGE)
- Stored in `notifications` table
- API endpoints: GET, PATCH, DELETE
- Metadata includes related resource IDs

## Chat System

- File/image support (fileUrl, fileType)
- Chat rooms between admin + customer
- Message notifications auto-sent
- isRead tracking
  │ │ ├── tool.controller.js
  │ │ └── ...
  │ ├── services/
  │ │ ├── collection.service.js
  │ │ ├── product.service.js
  │ │ ├── material.service.js
  │ │ ├── tool.service.js
  │ │ └── auth.service.js
  │ ├── routes/
  │ │ ├── collection.route.js
  │ │ ├── product.route.js
  │ │ ├── material.route.js
  │ │ ├── tool.route.js
  │ │ ├── index.js
  │ │ └── ...
  │ ├── validators/
  │ │ ├── collection.validator.js
  │ │ ├── product.validator.js
  │ │ └── ...
  │ ├── middlewares/
  │ │ ├── auth.middleware.js
  │ │ ├── error.middleware.js
  │ │ ├── validate.middleware.js
  │ │ └── response.middleware.js
  │ ├── config/
  │ │ ├── app.js
  │ │ ├── auth.js
  │ │ └── constants.js
  │ ├── libs/
  │ │ ├── prisma.js
  │ │ └── redis.js
  │ └── utils/
  │ ├── AppError.js
  │ └── catchAsync.js
  ├── prisma/
  │ ├── schema.postgres.prisma
  │ ├── schema.mariadb.prisma
  │ └── migrations/
  ├── scripts/
  │ └── prisma-generate.js
  ├── memory-bank/
  │ ├── ARCH.md
  │ ├── STATE.md
  │ ├── RULES.md
  │ └── TECH.md
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

GET /collections # All collections
GET /collections/:id # Collection detail

```

### Products

```

GET /products # All products (with filters)
GET /products/:id # Product detail

```

### Materials

```

GET /materials # All material products

```

### Tools

```

GET /tools # All tool products

```

### Authentication

```

POST /auth/admin/login # Admin login
POST /auth/customer/register # Customer register
POST /auth/customer/login # Customer login

```

### Cart (Auth Required)

```

GET /cart # Get customer's cart
POST /cart/add # Add to cart
PATCH /cart/:id # Update cart item
DELETE /cart/:id # Remove from cart

```

### Orders (Auth Required)

```

POST /orders # Create order
GET /orders/me # Get my orders
POST /orders/:id/cancel # Cancel order

````

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
````

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
