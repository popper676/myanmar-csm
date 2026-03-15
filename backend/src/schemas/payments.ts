import { z } from 'zod';

export const createPaymentSchema = z.object({
  supplierName: z.string().min(1).max(200),
  date: z.string().min(1),
  amount: z.number().min(0),
  method: z.enum(['Bank Transfer', 'Check', 'Cash', 'Mobile Banking']),
  reference: z.string().max(200).optional(),
  status: z.enum(['completed', 'pending', 'failed']).optional(),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(['completed', 'pending', 'failed']),
});

export const paymentQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
});
