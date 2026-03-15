import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generatePoNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(3, '0');
  return `PO-${year}-${seq}`;
}

export function generateShipmentId(): string {
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `SHP-${seq}`;
}

export function generatePaymentId(): string {
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `PAY-${seq}`;
}

export function generateTrackingNumber(carrier: string): string {
  const prefix = carrier.split(' ').map(w => w[0]).join('').toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `${prefix}-${date}-${seq}`;
}

export function computeStockStatus(quantity: number, minStock: number): 'sufficient' | 'low' | 'critical' {
  if (quantity <= minStock * 0.5) return 'critical';
  if (quantity <= minStock) return 'low';
  return 'sufficient';
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '').trim();
}

export function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
