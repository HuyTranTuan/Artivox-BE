# TECH: Stack & Setup

**Updated:** Jun 29, 2026

## Stack

| Layer      | Tech           | Version |
| ---------- | -------------- | ------- |
| Runtime    | Node.js        | 18+     |
| Server     | Express        | 4.18    |
| DB         | PostgreSQL     | 13+     |
| ORM        | Prisma         | 7.x     |
| Cache      | Redis          | 6+      |
| Auth       | JWT + bcryptjs | -       |
| Validation | Zod            | 3.x     |
| Real-time  | Socket.io      | 4.x     |
| AI         | OpenAI/Groq    | -       |

## Quick Setup (5 min)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env: DATABASE_URL, JWT secrets, AI keys

# 3. Migrate
npx prisma migrate deploy

# 4. Run
npm run dev  # http://localhost:5000
```

## .env Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/artivox_db"

# JWT
AUTH_JWT_SECRET="min_32_chars_required"
AUTH_JWT_REFRESH_SECRET="min_32_chars_required"
AUTH_ACCESS_TOKEN_TTL="1h"
AUTH_REFRESH_TOKEN_TTL="7d"

# AI (choose one provider)
AI_PROVIDER="groq"  # or "openai" or leave unset (will try gateway keys)

# Option A: Groq (FREE - Recommended for Development)
GROQ_API_KEY="gsk_..."
GROQ_MODEL="mixtral-8x7b-32768"

# Option B: OpenAI (Paid - Production)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# Option C: Gateway / OpenRouter (uses existing VERCEL_GATEWAY_API_KEY or OPENROUTER_GATEWAY_API_KEY)
# The AI service auto-resolves keys from multiple env variable names.

# Server
APP_PORT=3000
NODE_ENV="development"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# Optional
REDIS_URL="redis://localhost:6379"
BCRYPT_SALT=12
```

## Project Structure

```
src/
├── controllers/   # HTTP handlers
├── services/      # Business logic
├── routes/        # Endpoints
├── middlewares/   # Auth, validation
├── validators/    # Zod schemas
├── utils/         # Helpers
└── config/        # Configuration

prisma/
├── schema.prisma  # DB models (11 total)
└── migrations/    # 7 migrations applied
```

## Commands

```bash
npm run dev                           # Development with auto-reload
npm run watch                         # Watch mode
npm start                             # Production

npx prisma migrate dev --name "desc"  # New migration
npx prisma migrate deploy             # Apply migrations
npx prisma studio                     # GUI browser

npm test                              # Tests
npm run lint                          # Linting
node -c <file>                        # Check syntax
```

## Database Models (11)

Users, Orders, Articles, Products, Collections, Discounts, ChatRooms, ChatMessages, Notifications, ActivityLogs, AdminSettings

## API Endpoints: 50+

- Auth: 7 (register, login, logout, refresh, update account)
- Products: 8 (list, search, filter, CRUD)
- Orders: 6 (list, create, approve, cancel)
- Articles: 10 (list, search, create, publish, approve)
- Chat: 5 (room, messages, send, read, AI)
- Notifications: 6 (get, read, mark all, delete)
- Other: 10+ (collections, discounts, logs)

## Top 10 Most Used Endpoints

| Endpoint                 | Method | Purpose           |
| ------------------------ | ------ | ----------------- |
| /auth/customer/register  | POST   | Register new user |
| /auth/customer/login     | POST   | Login user        |
| /auth/admin/login        | POST   | Admin login       |
| /catalog/products        | GET    | List all products |
| /orders                  | POST   | Create order      |
| /orders/:orderId/approve | PATCH  | Approve order     |
| /chat/:roomId/message    | POST   | Send message      |
| /chat/:roomId/messages   | GET    | Get chat messages |
| /notifications           | GET    | Get notifications |
| /articles                | GET    | List all articles |

## Top 10 Most Used Files

| File                                   | Purpose               |
| -------------------------------------- | --------------------- |
| `.env`                                 | Environment variables |
| `prisma/schema.prisma`                 | Database schema       |
| `src/routes/index.js`                  | Route registration    |
| `src/services/chat.service.js`         | Chat logic            |
| `src/services/notification.service.js` | Notifications         |
| `src/services/ai.service.js`           | AI responses          |
| `src/middlewares/authMiddleware.js`    | Authentication        |
| `src/controllers/chat.controller.js`   | Chat controller       |
| `src/config/corsConfig.js`             | CORS configuration    |
| `server.js`                            | App entry point       |

## Authentication Flow

1. Register/Login → JWT access + refresh tokens
2. Access token: 1h expiration (configurable via AUTH_ACCESS_TOKEN_TTL)
3. Refresh token: 7d expiration (configurable via AUTH_REFRESH_TOKEN_TTL)
4. Use access token in `Authorization: Bearer <token>` header
5. Refresh endpoint: POST /auth/refresh-token
6. Bcryptjs salt rounds: 10

## AI Service Configuration

The AI service (`src/services/ai.service.js`) supports multiple API providers and auto-resolves API keys from multiple environment variable names.

### Supported Providers

**Groq (FREE - Recommended for Development):**

- Model: Mixtral-8x7b-32768 (default)
- No credit card needed
- Faster inference
- Setup: 5 minutes at https://console.groq.com

**OpenAI (Paid - Production):**

- Models: GPT-4-turbo-preview / GPT-3.5-turbo
- Cost: ~$0.50-$30/month typical
- Higher quality responses

**Key Resolution Order:**

1. `AI_API_KEY` (generic)
2. Provider-specific: `GROQ_API_KEY` or `OPENAI_API_KEY`
3. Fallback: `OPENROUTER_GATEWAY_API_KEY`, `VERCEL_GATEWAY_API_KEY`
4. Fallback: `AI_API_KEY_OPENAI`, `AI_API_KEY_GROQ`

### Conversation Context

- Last 5 messages used as context
- Helps AI understand conversation flow
- Context auto-built from chat history
- Messages filtered by valid senderType

### System Prompt

Default prompt for customer support:

- Product inquiries, orders, 3D printing guidance
- FDM and Resin materials expertise
- Concise, friendly responses
- Fallbacks to contact support if unknown

### Error Handling

- API errors caught silently
- Customer message still saved
- Fallback response sent (keyword-based)
- 30-second request timeout configured
- Common keywords: price, material, delivery, payment, order, help

### Pricing Comparison

| Provider | Model   | Cost/1K Tokens | Free Tier      | Speed     |
| -------- | ------- | -------------- | -------------- | --------- |
| OpenAI   | GPT-4   | $0.03          | No             | Medium    |
| OpenAI   | GPT-3.5 | $0.0005        | No             | Fast      |
| Groq     | Mixtral | $0             | Yes (generous) | Very Fast |
| Groq     | Llama 2 | $0             | Yes            | Very Fast |

### Customization Options

```javascript
// In ai.service.js:
max_tokens: 500,       // Response length
temperature: 0.7,      // Creativity (0.0 = deterministic, 1.0 = random)
timeout: 30000,        // Request timeout in ms
```

### Troubleshooting

**No AI response:**

1. Check API key in .env (verify format, not wrapped in quotes)
2. Verify AI_PROVIDER is set to "groq" or "openai"
3. Check API rate limits / quota
4. Restart server

**Generic responses:**

- Update system prompt in ai.service.js
- Add more context about specific products

**Slow responses:**

- OpenAI: Use gpt-3.5-turbo for faster responses
- Groq: Already optimized for speed

## Performance Notes

- Pagination: All list endpoints (use `limit` and `skip`)
- Indexes: Optimized for common queries
- Caching: **Cart** uses Redis cache-first (`cart:{customerId}`, TTL 1h); catalog GET routes use `cacheMiddleware(key, ttl)`
- Connection pooling: Built-in Prisma
- Rate limiting: Ready to implement

## Database Patterns

- **Soft Delete:** deletedAt !== null
- **Timestamps:** createdAt, updatedAt auto-managed
- **Polymorphic:** Product type = MODEL|MATERIAL|TOOL
- **Multi-lang:** ArticleTranslation with locale (vi, en)

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
curl http://localhost:3000/api/v1/catalog/collections
```

### Check Server Health

```bash
curl http://localhost:3000/
# Should return landing page
```

### Check AI Service

```bash
node -e "
require('dotenv').config();
const ai = require('./src/services/ai.service');
ai.generateAIResponse('test').then(r => console.log(r));
"
```

## Common Issues

### "Enum already exists"

**Cause**: Running `npx prisma generate` directly with dual schemas
**Fix**: Use `npm run prisma:generate` instead (runs in isolated process)

### "DATABASE_URL not found"

**Cause**: Missing .env file
**Fix**: `cp .env.example .env` and fill in values

### "Cannot find module @libs/prisma"

**Cause**: Module alias not loaded
**Fix**: Ensure `require('module-alias/register')` is first line in server.js

### "RedisError: connect ECONNREFUSED"

**Cause**: Redis not running
**Fix**: Start Redis: `redis-server`

### "Port in use"

**Cause**: Another process using the port
**Fix**: `APP_PORT=5001 npm run dev`

### "AI API Error"

**Cause**: No API key set or invalid key
**Fix**: Add AI API key to .env (any of the supported env var names)

### "Prisma migration conflicts"

**Cause**: Schema drift between migration history and database
**Fix**: `npx prisma migrate reset --force` (dev only), then `npx prisma migrate deploy`

### "CORS Error"

**Cause**: Frontend URL not in allowed origins
**Fix**: Add the URL to `CORS_ORIGINS` in .env

## Performance Tips

- Use Prisma Studio to inspect slow queries
- Add `.select()` instead of `.include()` when possible
- Cache frequently accessed collections in Redis
- Index commonly filtered fields in database
- Use pagination (`limit` + `skip`) for large datasets
- Filter early with query params to reduce data transfer

## Deployment

- Set `NODE_ENV=production`
- Use PM2 for process management
- Configure NGINX for load balancing
- Use separate database URLs for prod/staging
- Verify AI API key is active
- Update CORS origins for production domains
- Generate strong JWT secrets (use openssl rand -base64 32)
- Set up error monitoring

---

## Implementation Notes (Jun 29, 2026)

### Cart Redis Cache

```javascript
// cart.service.js — cache-first pattern:
// getCart: check redis → miss → Prisma → set cache (1h)
// addToCart/updateCartItem/removeFromCart: Prisma → invalidate cache
// Key: `cart:${customerId}`, TTL: 3600s
// Falls back to direct Prisma if Redis unavailable
```
