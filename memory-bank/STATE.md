# STATE: Current Progress

## Completed

- ✅ Express base with error middleware
- ✅ Prisma dual-database setup (PostgreSQL + MariaDB)
- ✅ Redis client initialization
- ✅ JWT authentication
- ✅ Module aliases (@controllers, @services, etc.)
- ✅ Catalog service refactor (split into: collection, product, material, tool)
- ✅ Prisma v6 enum conflict resolution (isolated process generation)
- ✅ Models service, controller, route (GET /models, GET /models/:slug)
- ✅ Materials slug detail (GET /materials/:slug)
- ✅ Tools slug detail (GET /tools/:slug)
- ✅ Customers public endpoints (GET /customers, GET /customers/:slug)
- ✅ Discounts public endpoints (GET /discounts, GET /discounts/:slug)
- ✅ Discount orders public endpoints (GET /discount_orders, GET /discount_orders/:id)
- ✅ Orders public endpoints (GET /orders, GET /orders/:id) with order_items join
- ✅ Articles locale support (GET /articles/vi, /articles/en, /articles/vi/:slug, /articles/en/:slug)
- ✅ Customer activity log endpoint (GET /customer-activity-log, auth required)

## Current Focus

- No active development — all requested routes are complete

## Endpoints Status

### Models

- [x] GET /api/v1/models (type=MODEL, join model_3d)
- [x] GET /api/v1/models/:slug

### Collections

- [x] GET /api/v1/collections
- [x] GET /api/v1/collections/:id

### Products

- [x] GET /api/v1/products (with search/type filter)
- [x] GET /api/v1/products/:slug

### Materials

- [x] GET /api/v1/materials (type=MATERIAL, join materials)
- [x] GET /api/v1/materials/:slug

### Tools

- [x] GET /api/v1/tools (type=TOOL, join tools)
- [x] GET /api/v1/tools/:slug

### Customers

- [x] GET /api/v1/customers
- [x] GET /api/v1/customers/:slug

### Orders

- [x] GET /api/v1/orders (public, all orders with items + customer)
- [x] GET /api/v1/orders/:id (public, single order detail)
- [x] POST /api/v1/orders (auth required, create from cart)
- [x] GET /api/v1/orders/me (auth required, my orders)
- [x] POST /api/v1/orders/:id/cancel (auth required)

### Discounts

- [x] GET /api/v1/discounts
- [x] GET /api/v1/discounts/:slug

### Discount Orders

- [x] GET /api/v1/discount_orders
- [x] GET /api/v1/discount_orders/:id

### Articles

- [x] GET /api/v1/articles
- [x] GET /api/v1/articles/:slug
- [x] GET /api/v1/articles/vi (published, locale=vi)
- [x] GET /api/v1/articles/en (published, locale=en)
- [x] GET /api/v1/articles/vi/:slug (published, locale=vi)
- [x] GET /api/v1/articles/en/:slug (published, locale=en)

### Customer Activity Log

- [x] GET /api/v1/customer-activity-log (auth required)

### Cart (Auth)

- [x] GET /api/v1/cart
- [x] POST /api/v1/cart/add
- [x] PATCH /api/v1/cart/:id
- [x] DELETE /api/v1/cart/:id

### Admin

- [x] CRUD users, products, discounts

### Auth

- [x] POST /api/v1/auth/admin/login
- [x] POST /api/v1/auth/customer/register
- [x] POST /api/v1/auth/customer/login
- [x] POST /api/v1/auth/refresh

## Services Created

| Service | File | Queries |
|---------|------|---------|
| models.service | `src/services/models.service.js` | getModels, getModelBySlug |
| customer.service | `src/services/customer.service.js` | getCustomers, getCustomerBySlug |
| discount.service | `src/services/discount.service.js` | getDiscounts, getDiscountBySlug |
| discountOrder.service | `src/services/discountOrder.service.js` | getDiscountOrders, getDiscountOrderById |
| customerActivityLog.service | `src/services/customerActivityLog.service.js` | getCustomerActivityLogs |

## Services Updated

| Service | Additions |
|---------|-----------|
| material.service | getMaterialBySlug |
| tool.service | getToolBySlug |
| order.service | getAllOrders, getOrderById |
| article.service | getArticlesByLocale, getArticleBySlugAndLocale |

## Dependencies Status

- @prisma/client: v7.8.0 ✓
- prisma: v7.8.0 ✓
- Express: v4.18.2 ✓
- Redis: v5.12.1 ✓
- Zod: v3.22.4 ✓

## Blockers

None. All requested routes are implemented and verified.