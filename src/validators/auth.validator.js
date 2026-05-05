const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  fullName: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
});

module.exports = { loginSchema, registerSchema };
