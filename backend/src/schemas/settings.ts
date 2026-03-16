import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  currency: z.string().max(10).optional(),
  language: z.string().max(20).optional(),
  fiscalYearStart: z.string().max(20).optional(),
});

export const createWarehouseSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(500),
  capacity: z.string().max(100).optional(),
  manager: z.string().max(200).optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores'),
  email: z.string().email(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  fullName: z.string().min(1).max(200),
  role: z.enum(['admin', 'manager', 'staff', 'viewer']),
  department: z.string().max(100).optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  role: z.enum(['admin', 'manager', 'staff', 'viewer']).optional(),
  department: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const updateNotificationsSchema = z.object({
  lowStockEmail: z.boolean().optional(),
  lowStockSms: z.boolean().optional(),
  newPoEmail: z.boolean().optional(),
  newPoSms: z.boolean().optional(),
  shipmentDelayedEmail: z.boolean().optional(),
  shipmentDelayedSms: z.boolean().optional(),
  paymentDueEmail: z.boolean().optional(),
  paymentDueSms: z.boolean().optional(),
});

export const updatePermissionsSchema = z.object({
  permissions: z.array(z.object({
    role: z.enum(['admin', 'manager', 'staff', 'viewer']),
    feature: z.string().min(1),
    allowed: z.boolean(),
  })),
});
