const { z } = require("zod");

const productQuerySchema = z.object({
  type: z.enum(["MODEL", "MATERIAL", "TOOL"]).optional(),
  search: z.string().min(1).max(120).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

module.exports = { productQuerySchema };
