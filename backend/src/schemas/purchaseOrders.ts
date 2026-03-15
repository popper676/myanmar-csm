import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierName: z.string().min(1).max(200),
  orderDate: z.string().min(1),
  expectedDelivery: z.string().optional(),
  warehouse: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(1),
    qty: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).min(1, 'At least one item is required'),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'approved', 'received', 'delivered', 'cancelled']),
});

export const purchaseOrderQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'confirmed', 'approved', 'received', 'delivered', 'cancelled']).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
});
