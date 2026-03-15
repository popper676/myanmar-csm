import { z } from 'zod';

export const createInventorySchema = z.object({
  sku: z.string().min(1).max(50),
  nameEn: z.string().min(1).max(200),
  nameMm: z.string().max(200).optional(),
  category: z.string().min(1).max(100),
  quantity: z.number().int().min(0),
  unit: z.string().min(1).max(20),
  minStock: z.number().int().min(0),
  warehouseName: z.string().min(1).max(200),
  unitPrice: z.number().min(0),
  supplierName: z.string().max(200).optional(),
});

export const updateInventorySchema = createInventorySchema.partial();

export const inventoryQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  warehouse: z.string().optional(),
  stockStatus: z.enum(['sufficient', 'low', 'critical']).optional(),
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
});
