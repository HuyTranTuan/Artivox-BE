content = """# API ENDPOINTS - CAVEMAN EDITION

**BASE:** `http://localhost:3000/api`  
**LOCK:** Put `Authorization: Bearer <accessToken>` in head. Use `Cookie: refreshToken=<token>` for new tokens.

---

## 🔐 AUTH (PROVE WHO YOU ARE)

- `POST /auth/customer/register` ── **In:** email, password, fullName ── **Out:** user, tokens
- `POST /auth/customer/login` ── **In:** email, password ── **Out:** user, tokens
- `POST /auth/admin/login` ── **In:** email, password ── **Out:** user, tokens
- `POST /auth/refresh-token` ── **In:** cookie/header ── **Out:** tokens
- `POST /auth/logout` `[Lock]` ── **Out:** logout msg
- `PATCH /auth/admin/account` `[Lock: Admin]` ── **In:** fullName?, email?, phone?, address? ── **Out:** Admin data
- `PATCH /auth/customer/account` `[Lock: Customer]` ── **In:** fullName?, email?, phone?, address?, password? ── **Out:** Customer data

---

## 📦 CATALOG (THINGS TO BUY)

- `GET /catalog/models` `[Ask: ?search&limit&skip]` ── **Out:** Models list
- `GET /catalog/models/:slug` ── **Out:** One Model details
- `GET /catalog/materials` `[Ask: ?type&limit&skip]` ── **Out:** Materials list
- `GET /catalog/materials/:slug` ── **Out:** One Material
- `GET /catalog/tools` `[Ask: ?limit&skip]` ── **Out:** Tools list
- `GET /catalog/tools/:slug` ── **Out:** One Tool
- `GET /catalog/products` `[Ask: ?type&search&limit&skip]` ── **Out:** Products list
- `GET /catalog/products/:slug` ── **Out:** One Product
- `GET /catalog/collections` ── **Out:** Collections list
- `GET /catalog/collections/:id` ── **Out:** One Collection + Products

---

## 🛒 SHOPPING (CART & DISCOUNTS)

- `GET /cart` `[Lock]` ── **Out:** Cart items
- `POST /cart/add` `[Lock]` ── **In:** productId, quantity ── **Out:** Item data
- `PATCH /cart/:cartItemId` `[Lock]` ── **In:** quantity ── **Out:** Fresh item data
- `DELETE /cart/:cartItemId` `[Lock]` ── **Out:** Delete msg
- `GET /discounts` ── **Out:** All discounts
- `GET /discounts/:slug` ── **Out:** One discount

---

## 📋 ORDERS (BUY NOW)

- `POST /orders` `[Lock]` ── **In:** shippingAddress ── **Out:** Order info `[Boom: Admin get notify]`
- `GET /orders/me` `[Lock]` ── **Out:** My orders
- `GET /orders` `[Lock: Admin]` ── **Out:** All orders
- `GET /orders/:orderId` ── **Out:** Order detail
- `POST /orders/:orderId/cancel` `[Lock]` ── **Out:** Cancelled order
- `PATCH /orders/:orderId/approve` `[Lock: Admin]` ── **Out:** Done order `[Boom: Customer get notify]`

---

## 📰 ARTICLES (WORDS ON STONE)

- `GET /articles` ── **Out:** All articles
- `GET /articles/:slug` ── **Out:** One article multi-lang
- `GET /articles/:lang` OR `/:lang/:slug` `(lang = vi/en)` ── **Out:** Safe published text
- `POST /articles` `[Lock: Admin/Staff]` ── **In:** slug, coverImage, translations ── **Out:** New article `[Boom: Admin get notify]`
- `PUT /articles/:slug` `[Lock: Owner]` ── **In:** coverImage?, translations? ── **Out:** Fixed article
- `DELETE /articles/:slug` `[Lock: Owner]` ── **Out:** Article gone
- `PATCH /articles/:articleId/approve` `[Lock: Manager]` ── **Out:** Live article `[Boom: Author get notify]`

---

## 💬 CHAT (UGGA BUGGA TALK)

- `GET /chat/rooms` `[Lock]` ── **Out:** Rooms + last talk
- `POST /chat/rooms` `[Lock: Admin]` ── **In:** customerId ── **Out:** Active room
- `GET /chat/:roomId/messages` `[Lock]` ── **Out:** Old talk messages
- `POST /chat/:roomId/message` `[Lock]` ── **In:** content, fileUrl?, fileType? ── **Out:** New message `[Boom: Recipient get notify]`
- `PATCH /chat/:roomId/read` `[Lock]` ── **Out:** Read success

---

## 🔔 NOTIFICATIONS (LOUD NOISES)

- `GET /notifications` `[Lock]` `[Ask: ?limit&offset&isRead]` ── **Out:** Loud noises list
- `GET /notifications/unread-count` `[Lock]` ── **Out:** Unread count number
- `GET /notifications/:id` `[Lock]` ── **Out:** Noise detail
- `PATCH /notifications/:id/read` `[Lock]` ── **Out:** Read true
- `PATCH /notifications/read-all` `[Lock]` ── **Out:** All read success
- `DELETE /notifications/:id` `[Lock]` ── **Out:** Noise gone

---

## 👥 USERS (TRIBE PEOPLE)

- `GET /customers` ── **Out:** Tribe list
- `GET /customers/:slug` ── **Out:** One tribe person info
- `GET /customer-activity-log` `[Lock]` ── **Out:** What person did log

---

## 🛡️ BAD THINGS (ERROR SHIELD)

If smash code, server throw:
