import { Router, Request, Response } from 'express';
import { prepare } from '../db-wrapper';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSupplierSchema, updateSupplierSchema, supplierQuerySchema } from '../schemas/suppliers';
import { generateId, paginationMeta } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', authenticate, validate(supplierQuerySchema, 'query'), (req: Request, res: Response) => {
  const { search, category, region, page, limit } = req.query as any;


  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (name_en LIKE ? OR name_mm LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }
  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }
  if (region) {
    whereClause += ' AND region = ?';
    params.push(region);
  }

  const countResult = prepare(`SELECT COUNT(*) as total FROM suppliers ${whereClause}`).get(...params) as { total: number };
  const offset = ((page || 1) - 1) * (limit || 50);

  const suppliers = prepare(`
    SELECT id, name_en as nameEn, name_mm as nameMm, location, township, city,
           category, rating, total_orders as totalOrders, phone, email,
           on_time_delivery as onTimeDelivery, avg_lead_time as avgLeadTime, region
    FROM suppliers ${whereClause}
    ORDER BY name_en ASC
    LIMIT ? OFFSET ?
  `).all(...params, limit || 50, offset);

  const categories = prepare('SELECT DISTINCT category FROM suppliers ORDER BY category').all()
    .map((r: any) => r.category);

  res.json({
    suppliers,
    categories,
    pagination: paginationMeta(countResult.total, page || 1, limit || 50),
  });
});

router.get('/:id', authenticate, (req: Request, res: Response) => {

  const supplier = prepare(`
    SELECT id, name_en as nameEn, name_mm as nameMm, location, township, city,
           category, rating, total_orders as totalOrders, phone, email,
           on_time_delivery as onTimeDelivery, avg_lead_time as avgLeadTime, region, notes
    FROM suppliers WHERE id = ?
  `).get(req.params.id);

  if (!supplier) throw new AppError(404, 'Supplier not found');
  res.json(supplier);
});

router.post('/', authenticate, authorize('admin', 'manager'), validate(createSupplierSchema), (req: Request, res: Response) => {

  const { nameEn, nameMm, location, township, city, category, phone, email, region, notes } = req.body;

  const id = generateId();
  prepare(`
    INSERT INTO suppliers (id, name_en, name_mm, location, township, city, category, phone, email, region, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, nameEn, nameMm || '', location || '', township || '', city || '', category || '', phone || '', email || '', region || null, notes || '');

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'create', 'supplier', ?)`)
    .run(generateId(), req.user!.userId, id);

  const supplier = prepare(`
    SELECT id, name_en as nameEn, name_mm as nameMm, location, township, city,
           category, rating, total_orders as totalOrders, phone, email,
           on_time_delivery as onTimeDelivery, avg_lead_time as avgLeadTime, region
    FROM suppliers WHERE id = ?
  `).get(id);

  res.status(201).json(supplier);
});

router.put('/:id', authenticate, authorize('admin', 'manager'), validate(updateSupplierSchema), (req: Request, res: Response) => {

  const { id } = req.params;

  const existing = prepare('SELECT id FROM suppliers WHERE id = ?').get(id);
  if (!existing) throw new AppError(404, 'Supplier not found');

  const fields: string[] = [];
  const values: any[] = [];
  const fieldMap: Record<string, string> = {
    nameEn: 'name_en', nameMm: 'name_mm', location: 'location', township: 'township',
    city: 'city', category: 'category', phone: 'phone', email: 'email', region: 'region', notes: 'notes',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (req.body[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(req.body[key]);
    }
  }

  if (fields.length === 0) throw new AppError(400, 'No fields to update');

  fields.push('updated_at = datetime("now")');
  values.push(id);

  prepare(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'update', 'supplier', ?)`)
    .run(generateId(), req.user!.userId, id);

  const supplier = prepare(`
    SELECT id, name_en as nameEn, name_mm as nameMm, location, township, city,
           category, rating, total_orders as totalOrders, phone, email,
           on_time_delivery as onTimeDelivery, avg_lead_time as avgLeadTime, region
    FROM suppliers WHERE id = ?
  `).get(id);

  res.json(supplier);
});

router.delete('/:id', authenticate, authorize('admin'), (req: Request, res: Response) => {

  const result = prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) throw new AppError(404, 'Supplier not found');

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'delete', 'supplier', ?)`)
    .run(generateId(), req.user!.userId, req.params.id);

  res.json({ message: 'Supplier deleted successfully' });
});

export default router;
