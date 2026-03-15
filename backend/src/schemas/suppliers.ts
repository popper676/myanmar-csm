import { z } from 'zod';

export const createSupplierSchema = z.object({
  nameEn: z.string().min(1).max(200),
  nameMm: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  township: z.string().max(200).optional(),
  city: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')),
  region: z.enum(['upper', 'lower']).optional(),
  notes: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  region: z.enum(['upper', 'lower']).optional(),
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
});
