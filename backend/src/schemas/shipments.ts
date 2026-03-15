import { z } from 'zod';

export const createShipmentSchema = z.object({
  fromEn: z.string().min(1).max(100),
  fromMm: z.string().max(100).optional(),
  toEn: z.string().min(1).max(100),
  toMm: z.string().max(100).optional(),
  carrier: z.string().min(1).max(200),
  dispatchDate: z.string().min(1),
  eta: z.string().min(1),
  items: z.array(z.string()).optional(),
});

export const updateShipmentStatusSchema = z.object({
  status: z.enum(['ordered', 'dispatched', 'in_transit', 'customs', 'delivered']),
});

export const shipmentQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});
