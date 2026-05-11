# RULES: Artivox Backend Conventions

## Code Style

- **CommonJS Only**: require/module.exports (NO import/export)
- **async/await**: Always. No .then() chains, no callbacks
- **Try-Catch**: Mandatory in every API endpoint
- **Comments**: Function purpose only - "// {purpose}" format
- **Naming**: camelCase for functions/variables, PascalCase for classes

## Architecture

- **MVC Pattern**: Controllers orchestrate, Services execute, Models query
- **Middleware First**: Register all middleware before routes
- **Error Handling**: Throw Error, let error middleware catch
- **Validation**: Use Zod schemas in validators/, validate in middleware

## Database

- **Prisma Only**: No raw SQL. Use prisma (connect to postgres)
- **Soft Delete**: Query with `{ deletedAt: null }` by default
- **Relations**: Use include/select for eager loading
- **Migrations**: Update schemas (postgres)

## Generate Prisma

```bash
npm run prisma:generate      # ✓ Correct (isolated process)
npm run prisma:migrate       # Create migrations
npm run prisma:studio        # Database UI
```

❌ Never: `npx prisma generate` (enum conflict)

## Service Pattern

- One service file per domain (collection.service.js, product.service.js, etc.)
- Direct service imports in controllers (NO aggregator)
- Each function = one query/workflow
- Error handling in services, not controllers

## Controller Pattern

- Import specific services (not catalog.service)
- Validate parameters in middleware (not controller)
- Thin layer: just call service + format response
- Always use res.success(data) or throw Error

## Route Pattern

- Mount at /api/v1 in index.js
- Validate with middleware (validateMiddleware, schema)
- Call controller
- Return via response middleware

## Git Commits

- Small, focused changes
- "feat: description", "fix: description"
- Update memory-bank STATE.md after each feature
