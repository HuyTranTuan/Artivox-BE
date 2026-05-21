const { z } = require("zod");

// Global search - simple query across all product types
const globalSearchSchema = z.object({
  q: z.string().min(1).max(120),
  limit: z.coerce.number().int().positive().max(50).default(20).optional(),
  type: z.enum(["MODEL", "MATERIAL", "TOOL"]).optional(),
});

// Models search - detailed with filters
const modelsSearchSchema = z.object({
  q: z.string().min(1).max(120),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  collectionId: z.coerce.number().int().optional(),
  sortBy: z.enum(["name", "price", "rating", "newest"]).default("newest").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

// Materials search - with type and color filters
const materialsSearchSchema = z.object({
  q: z.string().min(1).max(120),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  collectionId: z.coerce.number().int().optional(),
  materialType: z.enum(["FDM", "RESIN"]).optional(),
  color: z.string().max(50).optional(),
  sortBy: z.enum(["name", "price", "rating", "newest"]).default("newest").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

// Tools search - detailed with filters
const toolsSearchSchema = z.object({
  q: z.string().min(1).max(120),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  collectionId: z.coerce.number().int().optional(),
  sortBy: z.enum(["name", "price", "rating", "newest"]).default("newest").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

module.exports = {
  globalSearchSchema,
  modelsSearchSchema,
  materialsSearchSchema,
  toolsSearchSchema,
};
