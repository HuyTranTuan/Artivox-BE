# ARCH: Backend Architecture

**Updated:** May 17, 2026

## Overview

E-commerce backend for 3D printing: models, materials, tools.

- 50+ endpoints (28 public, 22+ protected)
- Real AI chat (OpenAI / Groq / OpenRouter)
- 5-type notification system (auto-triggers)
- PostgreSQL + Redis
- Role-based access (ADMIN, STAFF, MANAGER, CUSTOMER)
- Multi-language articles (vi, en)
- Soft delete pattern with audit trail

## Stack

- Node.js 18+, Express 4.18
- Prisma ORM 7.x, PostgreSQL 13+
- JWT auth + bcryptjs (salt: 10 rounds)
- Zod validation (15+ validators)
- Socket.io 4.x real-time
- OpenAI/Groq/OpenRouter APIs
- Redis 6+ caching (optional)

## Database (11 Models)

```
Users (Admin + Customer)
├── Profile, auth tokens, role-based permissions
├── Orders (with approval workflow)
│   └── OrderItems
├── Articles (multi-language via ArticleTranslation)
├── ChatRooms
│   └── Messages (file/image support, AI responses)
├── Notifications (5 types with auto-triggers)
├── ActivityLogs (audit trail)
└── Other: Products (polymorphic), Collections, Discounts, AdminSettings
```

### Database Patterns

- **Soft delete:** `deletedAt` field on all models
- **Timestamps:** `createdAt`, `updatedAt` auto-managed
- **Polymorphic:** Product type = MODEL|MATERIAL|TOOL
- **Multi-language:** Article + ArticleTranslation with locale (vi, en)
- **Approval workflows:** Order (pending→approved), Article (draft→published)
- **Indexes:** Optimized for common queries
- **Migrations:** 7 applied successfully

## Request Flow

```
Route → Auth Middleware → Validation (Zod) → Controller → Service → Prisma → Response
```

## Services Architecture

**Core Services (18 total):**

| Service      | File                             | Key Functions                         |
| ------------ | -------------------------------- | ------------------------------------- |
| auth         | `auth.service.js`                | JWT, register, login, logout, refresh |
| product      | `product.service.js`             | Catalog listing, search, type filter  |
| order        | `order.service.js`               | Orders + approval workflow            |
| article      | `article.service.js`             | Articles + multi-lang + publish       |
| chat         | `chat.service.js`                | Chat rooms, messages, file support    |
| notification | `notification.service.js`        | 5 types, CRUD, auto-triggers          |
| ai           | `ai.service.js`                  | OpenAI/Groq/OpenRouter responses      |
| customer     | `customer.service.js`            | Customer listing, profiles            |
| discount     | `discount.service.js`            | Discount listing, slugs               |
| collection   | `collection.service.js`          | Collection CRUD                       |
| material     | `material.service.js`            | Materials + slug detail               |
| tool         | `tool.service.js`                | Tools + slug detail                   |
| models       | `models.service.js`              | 3D models listing                     |
| activityLog  | `customerActivityLog.service.js` | Audit trail                           |

**Pattern:** Each service = business logic, handles all database ops, triggers notifications

## Controllers

Thin layer: validate request, call service, return standardized response

## Routes (50+ Endpoints)

### Auth (7 endpoints)

| Method | Endpoint                | Auth        | Purpose                 |
| ------ | ----------------------- | ----------- | ----------------------- |
| POST   | /auth/customer/register | ❌          | Register customer       |
| POST   | /auth/customer/login    | ❌          | Customer login          |
| POST   | /auth/admin/login       | ❌          | Admin login             |
| POST   | /auth/refresh-token     | ❌          | Refresh access token    |
| POST   | /auth/logout            | ✅          | Logout                  |
| PATCH  | /auth/admin/account     | ✅ ADMIN    | Update admin profile    |
| PATCH  | /auth/customer/account  | ✅ CUSTOMER | Update customer profile |

### Catalog - Products (8 endpoints)

| Method | Endpoint                 | Auth | Purpose                                               |
| ------ | ------------------------ | ---- | ----------------------------------------------------- |
| GET    | /catalog/products        | ❌   | List all products (query: ?type, search, limit, skip) |
| GET    | /catalog/products/:slug  | ❌   | Get product by slug                                   |
| GET    | /catalog/models          | ❌   | List 3D models                                        |
| GET    | /catalog/models/:slug    | ❌   | Get model details                                     |
| GET    | /catalog/materials       | ❌   | List materials                                        |
| GET    | /catalog/materials/:slug | ❌   | Get material details                                  |
| GET    | /catalog/tools           | ❌   | List tools                                            |
| GET    | /catalog/tools/:slug     | ❌   | Get tool details                                      |

### Catalog - Collections (2 endpoints)

| Method | Endpoint                 | Auth | Purpose               |
| ------ | ------------------------ | ---- | --------------------- |
| GET    | /catalog/collections     | ❌   | List all collections  |
| GET    | /catalog/collections/:id | ❌   | Collection + products |

### Cart (4 endpoints)

| Method | Endpoint          | Auth | Purpose                        |
| ------ | ----------------- | ---- | ------------------------------ |
| GET    | /cart             | ✅   | View cart                      |
| POST   | /cart/add         | ✅   | Add item (productId, quantity) |
| PATCH  | /cart/:cartItemId | ✅   | Update quantity                |
| DELETE | /cart/:cartItemId | ✅   | Remove item                    |

### Orders (6 endpoints)

| Method | Endpoint                 | Auth     | Purpose                  |
| ------ | ------------------------ | -------- | ------------------------ |
| POST   | /orders                  | ✅       | Create order from cart   |
| GET    | /orders                  | ❌       | List all orders (public) |
| GET    | /orders/:orderId         | ❌       | Get order details        |
| GET    | /orders/me               | ✅       | Get my orders            |
| POST   | /orders/:orderId/cancel  | ✅       | Cancel pending order     |
| PATCH  | /orders/:orderId/approve | ✅ ADMIN | Approve order            |

### Articles (10 endpoints)

| Method | Endpoint                     | Auth     | Purpose               |
| ------ | ---------------------------- | -------- | --------------------- |
| GET    | /articles                    | ❌       | List all articles     |
| GET    | /articles/:slug              | ❌       | Get article detail    |
| GET    | /articles/vi                 | ❌       | Articles (Vietnamese) |
| GET    | /articles/en                 | ❌       | Articles (English)    |
| GET    | /articles/vi/:slug           | ❌       | Article (Vietnamese)  |
| GET    | /articles/en/:slug           | ❌       | Article (English)     |
| POST   | /articles                    | ✅ STAFF | Create article        |
| PUT    | /articles/:slug              | ✅ STAFF | Update article        |
| DELETE | /articles/:slug              | ✅ STAFF | Soft delete article   |
| PATCH  | /articles/:articleId/approve | ✅ ADMIN | Publish article       |

### Chat (5 endpoints)

| Method | Endpoint               | Auth     | Purpose                                     |
| ------ | ---------------------- | -------- | ------------------------------------------- |
| GET    | /chat/rooms            | ✅       | Get my chat rooms                           |
| POST   | /chat/rooms            | ✅ ADMIN | Create room (customerId)                    |
| GET    | /chat/:roomId/messages | ✅       | Get messages in room                        |
| POST   | /chat/:roomId/message  | ✅       | Send message (content, fileUrl?, fileType?) |
| PATCH  | /chat/:roomId/read     | ✅       | Mark messages as read                       |

### Notifications (6 endpoints)

| Method | Endpoint                    | Auth | Purpose                                              |
| ------ | --------------------------- | ---- | ---------------------------------------------------- |
| GET    | /notifications              | ✅   | Get paginated notifications (?limit, offset, isRead) |
| GET    | /notifications/unread-count | ✅   | Get unread count                                     |
| GET    | /notifications/:id          | ✅   | Get notification details                             |
| PATCH  | /notifications/:id/read     | ✅   | Mark as read                                         |
| PATCH  | /notifications/read-all     | ✅   | Mark all as read                                     |
| DELETE | /notifications/:id          | ✅   | Delete notification                                  |

### Customers (2 endpoints)

| Method | Endpoint         | Auth | Purpose              |
| ------ | ---------------- | ---- | -------------------- |
| GET    | /customers       | ❌   | List all customers   |
| GET    | /customers/:slug | ❌   | Get customer profile |

### Discounts (2 endpoints)

| Method | Endpoint         | Auth | Purpose              |
| ------ | ---------------- | ---- | -------------------- |
| GET    | /discounts       | ❌   | List all discounts   |
| GET    | /discounts/:slug | ❌   | Get discount details |

### Activity Logs (1 endpoint)

| Method | Endpoint               | Auth | Purpose           |
| ------ | ---------------------- | ---- | ----------------- |
| GET    | /customer-activity-log | ✅   | Get activity logs |

### Admin - Dashboard (1 endpoint)

| Method | Endpoint               | Auth     | Purpose                     |
| ------ | ---------------------- | -------- | --------------------------- |
| GET    | /admin/dashboard       | ✅ ADMIN | Admin dashboard (all stats) |
| GET    | /admin/staff/dashboard | ✅       | Staff personal dashboard    |

### Search (4 endpoints) - 🆕 PENDING

| Method | Endpoint          | Auth | Purpose                                 |
| ------ | ----------------- | ---- | --------------------------------------- |
| GET    | /search           | ❌   | Global search (all types + collections) |
| GET    | /search/models    | ❌   | Search models (advanced filters)        |
| GET    | /search/materials | ❌   | Search materials (type/unit filters)    |
| GET    | /search/tools     | ❌   | Search tools (specs search)             |

### Base URL

```
http://localhost:3000/api/v1
```

### Query Parameters

- **Pagination:** `?limit=20&skip=0` or `?limit=50&offset=0`
- **Filtering:** `?type=MODEL`, `?search=keyword`, `?isRead=true`, `?locale=vi`
- **Slug-based:** Friendly URLs for products and articles

## Standard Response Format

### Success

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    /* result */
  }
}
```

### Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "data": null
}
```

### Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | OK                                   |
| 201  | Created                              |
| 400  | Bad Request (invalid input)          |
| 401  | Unauthorized (auth required)         |
| 403  | Forbidden (insufficient permissions) |
| 404  | Not Found                            |
| 500  | Server Error                         |

## Validation

Zod schemas in `/validators` folder for all endpoints.
Validation occurs in middleware, not controllers.
Error messages clear and brief.

## Key Features

### Auto-Triggers (Notifications)

| Type             | Trigger                   | Recipient  | Metadata             |
| ---------------- | ------------------------- | ---------- | -------------------- |
| CHAT_MESSAGE     | New chat message          | Both users | roomId, senderType   |
| ORDER_CREATED    | Order placed → admins     | Admin      | orderId, customerId  |
| ORDER_APPROVED   | Admin approves → customer | Customer   | orderId, orderNumber |
| ARTICLE_CREATED  | Article created → admins  | Admin      | articleId, authorId  |
| ARTICLE_APPROVED | Article approved → author | Author     | articleId, slug      |

### AI Chat

- Real OpenAI GPT-4/GPT-3.5-turbo APIs
- Or free Groq Mixtral-8x7b (free tier)
- Or OpenRouter gateway (uses VERCEL_GATEWAY_API_KEY or OPENROUTER_GATEWAY_API_KEY)
- Auto-responds to customer text messages (not file attachments)
- Conversation context aware (last 5 messages)
- Fallback responses if API unavailable (keyword-based)
- 30-second request timeout
- Customizable system prompt, temperature, max_tokens

### Authentication

- JWT tokens (access: 1h configurable, refresh: 7d configurable)
- Bcryptjs password hashing (salt rounds: 10)
- Role-based authorization (ADMIN/STAFF/MANAGER/CUSTOMER)
- Cookie-based refresh token support via cookie-parser
- CORS configured for frontend domains

### Chat System

- Text messages + file/image support (fileUrl, fileType)
- Chat rooms between admin + customer
- Message notifications auto-sent
- isRead tracking per room
- AI auto-response for customer messages (text only)

## Folder Structure

```
src/
├── controllers/   # HTTP handlers
├── services/      # Business logic
├── routes/        # Endpoints
├── middlewares/   # Auth, validation, error
├── validators/    # Zod schemas
├── utils/         # Helpers (beLandingPage, AppError, catchAsync)
├── config/        # Setup (corsConfig, auth, constants)
└── libs/          # Prisma client, Redis client

prisma/
├── schema.prisma  # Models (11 total, 8 enums)
├── prisma.config.ts # Prisma configuration
└── migrations/    # 7 applied migrations
```

## Service/Controller Per Resource Pattern

Every resource follows the same pattern:

1. **Service** (`src/services/*.service.js`) — Prisma queries, business logic, notification triggers
2. **Controller** (`src/services/*.controller.js`) — catchAsync wrapper, request handling
3. **Route** (`src/routes/*.route.js`) — Express router with middleware binding

## Known Issues & Solutions

- **Prisma v6 Enum Conflict**: Dual schemas cause namespace collision
  - **Fix**: `scripts/prisma-generate.js` runs generation in isolated processes

---

## 🆕 Pending Implementation (May 20, 2026)

### Staff Dashboard

- **Endpoint:** `GET /admin/staff/dashboard` (authenticated)
- **Location:** Add to `admin.service.js` + `admin.controller.js`
- **Returns:** Personal stats (orders handled, revenue, chat rooms, pending approvals)
- **Queries:** Filter by staffId - recent orders, top customers, order status distribution

### Search APIs (4 variants)

1. **Global:** `GET /search?q=...` - All products + collections
2. **Models:** `GET /search/models?q=...&collectionId&priceMin&sort` - Advanced
3. **Materials:** `GET /search/materials?q=...&type=FDM&unit=GRAM` - Type/unit filters
4. **Tools:** `GET /search/tools?q=...&priceMin&priceMax` - Specs search

- **Location:** Create `src/services/search.service.js`, `src/controllers/search.controller.js`, `src/routes/search.route.js`

### Schema Issues Found

1. 🔴 Missing `Order.assignedAdminId` - breaks admin dashboard
2. 🟡 Wrong order status queries - should check `paymentStatus` not `status`
3. 🟡 Notification design flaw - should use typed relations
4. 🟡 Missing email verification tokens
5. 🟠 No Cart model - performance impact

- **Usage**: `npm run prisma:generate` (never `npx prisma generate`)
- **Critical**: @prisma/client version must match prisma CLI version (both v7+)

- **AI API Key Resolution**: Multiple env var names supported
  - Primary: AI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY
  - Fallback: OPENROUTER_GATEWAY_API_KEY, VERCEL_GATEWAY_API_KEY
  - The service auto-resolves in priority order

## Security Headers

- `Authorization: Bearer <accessToken>` for protected routes
- `Cookie: refreshToken=<token>` for refresh
- CORS restricted to known origins
- Error messages don't leak system details
- Soft delete prevents data loss
