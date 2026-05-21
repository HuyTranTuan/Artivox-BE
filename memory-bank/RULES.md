# RULES: Code Standards

**Updated:** May 17, 2026

## JavaScript Style

- `async/await` only (no .then, no callbacks)
- `try-catch` in all endpoints
- `camelCase` variables, `PascalCase` classes
- Clean comments, just purpose: `// Get all products`
- Named exports only

## Architecture

- **Service → Controller → Route** pattern
- **Service:** All business logic + database
- **Controller:** Thin handler, validate + call service + return
- **Route:** Just mount endpoints

## Database

- **Prisma only** - No raw SQL
- **Soft delete:** Always query with `deletedAt: null`
- **Relations:** Use include/select for eager load
- **Migrations:** `npx prisma migrate dev --name "desc"`

## Services

```javascript
// One service per domain
// Each function = one workflow
// Handle errors inside

const createOrder = async (customerId, items) => {
  // Business logic
  // Database ops
  // Notifications
};

const approveOrder = async (orderId) => {
  // Update status
  // Send notification
  // Return order
};
```

## Controllers

```javascript
// Thin layer - just call service
// Validation in middleware

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body.items);
    res.status(201).json(order);
  } catch (error) {
    throw error;
  }
};
```

## Routes

```javascript
// Register in routes/index.js
// Use middleware for auth + validation

router.post("/orders", authenticateToken, validateSchema(orderSchema), orderController.createOrder);
```

## Validation

- Use Zod schemas in `/validators`
- Validate in middleware, not controller
- Error messages clear and brief

## Error Handling

- Throw Error in service
- Catch in controller
- Middleware formats response
- Never expose sensitive data

## Database Commands

```bash
npm run dev                          # Start
npx prisma migrate dev --name "x"    # New migration
npx prisma migrate deploy            # Apply
npx prisma studio                    # GUI
node -c <file>                       # Check syntax
```

## API Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

Or error:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## Authentication

- JWT in `Authorization: Bearer <token>` header
- Access: 1h, Refresh: 7d
- Bcryptjs for passwords (saltRounds: 10)
- Verify token in middleware

## Testing Checklist

- [ ] Syntax: `node -c src/services/x.js`
- [ ] Database: Can connect
- [ ] AI keys: Set in .env
- [ ] CORS: Configured
- [ ] JWT secrets: 32+ chars
- [ ] All endpoints: Work
- [ ] Error cases: Handled

## Git Commits

- Focused, single feature per commit
- Format: `feat: add X` or `fix: Y`
- Update memory-bank/STATE.md after feature

## When Stuck

1. Check ARCH.md (design)
2. Check TECH.md (setup)
3. Check similar service (pattern reference)
4. Check TESTING_GUIDE.md (endpoint examples)
5. Check error logs

## Quick Reference

| Task          | Command                                |
| ------------- | -------------------------------------- |
| Start dev     | `npm run dev`                          |
| New migration | `npx prisma migrate dev --name "desc"` |
| Check syntax  | `node -c src/services/x.js`            |
| View DB       | `npx prisma studio`                    |
| Test endpoint | Use curl or Postman                    |

---

## 📋 AUDIT NOTES (May 20, 2026)

### Task 1: Customer Register ✅

- **Status:** WORKING - all fields validated and saved correctly
- **Key Field:** `gender` enum (M, F) - must use uppercase
- **Flow:** Register → Save all fields → Return tokens + user object

### Task 2: Staff Dashboard 🆕

- **Endpoint:** `GET /admin/staff/dashboard`
- **Status:** PENDING - needs service + controller implementation
- **Returns:** Personal stats (orders, revenue, chat rooms, pending approvals)
- **Location:** Add to `admin.service.js` + `admin.controller.js`

### Task 3: Prisma Schema Audit ✅

- **Critical Issues:** 1
- **Medium Issues:** 3
- **Low Issues:** 1
- **See STATE.md for full details**

### Task 4: Search APIs 🆕

- **Status:** PENDING - 4 endpoints designed
- **API 1:** `GET /search?q=...` - Global search
- **API 2:** `GET /search/models?q=...&collectionId&priceMin&sort`
- **API 3:** `GET /search/materials?q=...&type&unit`
- **API 4:** `GET /search/tools?q=...&priceMin&priceMax`
- **Location:** Create `search.service.js` + `search.controller.js` + `search.route.js`
