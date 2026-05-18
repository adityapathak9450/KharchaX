import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category required"),
  wallet: z.string().min(1, "Wallet required"),
  date: z.string().or(z.date()),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().max(500).optional(),
  attachments: z.array(z.string()).optional().default([]),
});

export const updateTransactionSchema = createTransactionSchema.partial();
