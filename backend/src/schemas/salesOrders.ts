import { z } from 'zod';

export const createSalesOrderSchema = z.object({
  customerName: z.string().min(1).max(200),
  orderDate: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    inventoryItemId: z.string().min(1),
    qty: z.number().int().min(1),
    unitPrice: z.number().min(0).optional(),
  })).min(1, 'At least one item is required'),
});

export const updateSalesOrderStatusSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'fulfilled', 'cancelled']),
});

export const salesOrderQuerySchema = z.object({
  status: z.enum(['all', 'draft', 'confirmed', 'fulfilled', 'cancelled']).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
});
