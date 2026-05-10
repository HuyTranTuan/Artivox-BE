const { z } = require("zod");

const productQuerySchema = z.object({
  type: z.enum(["MODEL", "MATERIAL", "TOOL"]).optional(),
  search: z.string().min(1).max(120).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});
const modelQuerySchema = z.object({
  type: z.enum(["MODEL"]).optional(),
  search: z.string().min(1).max(120).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});
const materialQuerySchema = z.object({
  type: z.enum(["MATERIAL"]).optional(),
  search: z.string().min(1).max(120).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});
const toolQuerySchema = z.object({
  type: z.enum(["TOOL"]).optional(),
  search: z.string().min(1).max(120).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

const createModelSchema = z.object({
  name: z.string.max(128).require(),
  slug: z.string.min(10).max(150).require(),
  thumbnail: z.string.require(),
  description: z.string.min(20).max(255).require(),
  type: z.enum(["MODEL", "MATERIAL", "TOOL"]).optional().default("MODEL"),
  collection: z.enum(["MODEL", "MATERIAL", "TOOL"]).optional().default("MODEL"),
  basePrice:


})

module.exports { productQuerySchema, modelQuerySchema, materialQuerySchema, toolQuerySchema}