# API ENDPOINTS

**BASE:** `http://localhost:3000/api`
**AUTH:** `Authorization: Bearer <accessToken>`

Same content as Artivox-Admin/memory-bank/API_ENDPOINTS.md — single source of truth.
See that file for the full table.

---

## Quick Ref

```
/auth                   → customer/admin auth + OAuth
/admin                  → admin/staff management, dashboard
/catalog/models         → CRUD (admin) + GET (public)
/catalog/materials      → CRUD (admin) + GET (public)
/catalog/tools          → CRUD (admin) + GET (public)
/catalog/products       → GET + PATCH (collection/discount assign) + rate
/catalog/collections    → CRUD (admin) + GET (public)
/cart                   → user cart (all auth)
/orders                 → order lifecycle
/articles               → CMS multi-lang CRUD
/chat                   → rooms, messages, AI, internal staff
/discounts              → discount campaigns CRUD
/discount_orders        → discount order records
/notifications          → notification CRUD
/search                 → global + models/materials/tools typed
/customers              → customer lookup
/customer-activity-log  → activity logs
/location               → provinces, wards
```

## Auth Details

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/customer/register` | email, password, fullName |
| POST | `/auth/customer/login` | email, password |
| POST | `/auth/admin/login` | email, password |
| POST | `/auth/refresh-token` | cookie or header |
| POST | `/auth/logout` | auth required |
| GET | `/auth/me` | current user |
| PATCH | `/auth/admin/account` | auth required |
| PATCH | `/auth/customer/account` | auth required |
| PATCH | `/auth/admin/change-password` | auth required |
| PATCH | `/auth/customer/change-password` | auth required |
| POST | `/auth/forgot-password` | rate limited |
| POST | `/auth/reset-password` | token + newPassword |
| POST | `/auth/verify-email` | token |
| POST | `/auth/resend-verify-email` | email |
| GET | `/auth/customer/google` | OAuth redirect |
| GET | `/auth/customer/google/callback` | OAuth callback |

## Chat Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/chat/ai` | No auth — AI reply |
| GET | `/chat/rooms` | auth |
| POST | `/chat/rooms` | auth |
| POST | `/chat/rooms/:roomId/claim` | auth — staff claim room |
| GET | `/chat/rooms/:roomId/messages` | auth |
| POST | `/chat/rooms/:roomId/messages` | auth |
| PATCH | `/chat/rooms/:roomId/read` | auth |
| GET | `/chat/internal-users` | auth |
| GET | `/chat/internal-rooms` | auth |
| POST | `/chat/internal-rooms` | auth |
| GET | `/chat/internal-rooms/:roomId/messages` | auth |
| POST | `/chat/internal-rooms/:roomId/messages` | auth |
| PATCH | `/chat/internal-rooms/:roomId/read` | auth |

## Order Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/orders` | public |
| POST | `/orders` | auth |
| GET | `/orders/me` | auth |
| GET | `/orders/:orderId` | public |
| POST | `/orders/:orderId/cancel` | auth |
| PATCH | `/orders/:orderId/approve` | auth |
| PATCH | `/orders/:orderId/payment-status` | auth |

## Admin Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/staff/dashboard` | any auth |
| POST | `/admin/staff/upload-image` | ADMIN/MANAGER/STAFF |
| GET | `/admin/dashboard` | ADMIN only |
| GET | `/admin/users` | ADMIN |
| GET | `/admin/customers` | ADMIN |
| GET | `/admin/customers/:slug` | ADMIN |
| PATCH | `/admin/customers/:slug/banned` | ADMIN |
| GET | `/admin/orders` | ADMIN |
| PATCH | `/admin/orders/:id` | ADMIN |
| GET | `/admin/revenue` | ADMIN |
| POST | `/admin/staff-create` | ADMIN |
| PATCH | `/admin/staff-decentralize/:email` | ADMIN |
