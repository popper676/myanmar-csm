import { z } from 'zod';

export const invoiceQuerySchema = z.object({
  status: z.enum(['all', 'unpaid', 'partial', 'paid', 'cancelled']).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['unpaid', 'partial', 'paid', 'cancelled']),
  paidAmount: z.number().min(0).optional(),
});
