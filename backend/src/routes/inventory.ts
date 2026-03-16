import { Router, Request, Response } from 'express';
import { prepare, transaction } from '../db-wrapper';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createInventorySchema, updateInventorySchema, inventoryQuerySchema, bulkDeleteSchema } from '../schemas/inventory';
import { generateId, computeStockStatus, paginationMeta, csvSafeValue } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', authenticate, validate(inventoryQuerySchema, 'query'), (req: Request, res: Response) => {
  const { search, category, warehouse, stockStatus, page, limit, sortBy, sortOrder } = req.query as any;


  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (name_en LIKE ? OR name_mm LIKE ? OR sku LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }
  if (warehouse) {
    whereClause += ' AND warehouse_name = ?';
    params.push(warehouse);
  }
  if (stockStatus) {
    whereClause += ' AND stock_status = ?';
    params.push(stockStatus);
  }

  const countResult = prepare(`SELECT COUNT(*) as total FROM inventory_items ${whereClause}`).get(...params) as { total: number };

  const validSortColumns: Record<string, string> = {
    sku: 'sku', name: 'name_en', category: 'category', quantity: 'quantity',
    warehouse: 'warehouse_name', status: 'stock_status', updated: 'last_updated',
  };
  const orderCol = validSortColumns[sortBy || ''] || 'last_updated';
  const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const offset = ((page || 1) - 1) * (limit || 20);
  const items = prepare(`
    SELECT id, sku, name_en as nameEn, name_mm as nameMm, category, quantity, unit,
           min_stock as minStock, warehouse_name as warehouse, last_updated as lastUpdated,
           unit_price as unitPrice, supplier_name as supplier, stock_status as stockStatus
    FROM inventory_items ${whereClause}
    ORDER BY ${orderCol} ${orderDir}
    LIMIT ? OFFSET ?
  `).all(...params, limit || 20, offset);

  res.json({
    items,
    pagination: paginationMeta(countResult.total, page || 1, limit || 20),
  });
});

router.get('/categories', authenticate, (_req: Request, res: Response) => {

  const categories = prepare('SELECT DISTINCT category FROM inventory_items ORDER BY category').all()
    .map((r: any) => r.category);
  res.json(categories);
});

router.get('/warehouses', authenticate, (_req: Request, res: Response) => {

  const warehouses = prepare('SELECT DISTINCT warehouse_name FROM inventory_items ORDER BY warehouse_name').all()
    .map((r: any) => r.warehouse_name);
  res.json(warehouses);
});

router.get('/units', authenticate, (_req: Request, res: Response) => {
  res.json(['kg', 'liter', 'pcs', 'meter']);
});

router.get('/:id', authenticate, (req: Request, res: Response) => {

  const item = prepare(`
    SELECT id, sku, name_en as nameEn, name_mm as nameMm, category, quantity, unit,
           min_stock as minStock, warehouse_name as warehouse, last_updated as lastUpdated,
           unit_price as unitPrice, supplier_name as supplier, stock_status as stockStatus
    FROM inventory_items WHERE id = ?
  `).get(req.params.id);

  if (!item) throw new AppError(404, 'Item not found');
  res.json(item);
});

router.post('/', authenticate, authorize('admin', 'manager', 'staff'), validate(createInventorySchema), (req: Request, res: Response) => {

  const { sku, nameEn, nameMm, category, quantity, unit, minStock, warehouseName, unitPrice, supplierName } = req.body;

  const existing = prepare('SELECT id FROM inventory_items WHERE sku = ?').get(sku);
  if (existing) throw new AppError(409, 'SKU already exists');

  const stockStatus = computeStockStatus(quantity, minStock);
  const id = generateId();

  prepare(`
    INSERT INTO inventory_items (id, sku, name_en, name_mm, category, quantity, unit, min_stock,
      warehouse_name, unit_price, supplier_name, stock_status, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, sku, nameEn, nameMm || '', category, quantity, unit, minStock, warehouseName, unitPrice, supplierName || '', stockStatus);

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'create', 'inventory', ?)`)
    .run(generateId(), req.user!.userId, id);

  const item = prepare(`
    SELECT id, sku, name_en as nameEn, name_mm as nameMm, category, quantity, unit,
           min_stock as minStock, warehouse_name as warehouse, last_updated as lastUpdated,
           unit_price as unitPrice, supplier_name as supplier, stock_status as stockStatus
    FROM inventory_items WHERE id = ?
  `).get(id);

  res.status(201).json(item);
});

router.put('/:id', authenticate, authorize('admin', 'manager', 'staff'), validate(updateInventorySchema), (req: Request, res: Response) => {

  const { id } = req.params;

  const existing = prepare('SELECT id FROM inventory_items WHERE id = ?').get(id);
  if (!existing) throw new AppError(404, 'Item not found');

  const fields: string[] = [];
  const values: any[] = [];
  const fieldMap: Record<string, string> = {
    sku: 'sku', nameEn: 'name_en', nameMm: 'name_mm', category: 'category',
    quantity: 'quantity', unit: 'unit', minStock: 'min_stock', warehouseName: 'warehouse_name',
    unitPrice: 'unit_price', supplierName: 'supplier_name',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (req.body[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(req.body[key]);
    }
  }

  if (req.body.quantity !== undefined || req.body.minStock !== undefined) {
    const current = prepare('SELECT quantity, min_stock FROM inventory_items WHERE id = ?').get(id) as any;
    const qty = req.body.quantity ?? current.quantity;
    const min = req.body.minStock ?? current.min_stock;
    fields.push('stock_status = ?');
    values.push(computeStockStatus(qty, min));
  }

  fields.push('last_updated = datetime("now")');
  values.push(id);

  prepare(`UPDATE inventory_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'update', 'inventory', ?)`)
    .run(generateId(), req.user!.userId, id);

  const item = prepare(`
    SELECT id, sku, name_en as nameEn, name_mm as nameMm, category, quantity, unit,
           min_stock as minStock, warehouse_name as warehouse, last_updated as lastUpdated,
           unit_price as unitPrice, supplier_name as supplier, stock_status as stockStatus
    FROM inventory_items WHERE id = ?
  `).get(id);

  res.json(item);
});

router.delete('/:id', authenticate, authorize('admin', 'manager'), (req: Request, res: Response) => {

  const result = prepare('DELETE FROM inventory_items WHERE id = ?').run(req.params.id);
  if (result.changes === 0) throw new AppError(404, 'Item not found');

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'delete', 'inventory', ?)`)
    .run(generateId(), req.user!.userId, req.params.id);

  res.json({ message: 'Item deleted successfully' });
});

router.post('/bulk-delete', authenticate, authorize('admin', 'manager'), validate(bulkDeleteSchema), (req: Request, res: Response) => {

  const { ids } = req.body;

  const deleted = transaction(() => {
    const placeholders = ids.map(() => '?').join(',');
    const result = prepare(`DELETE FROM inventory_items WHERE id IN (${placeholders})`).run(...ids);

    for (const id of ids) {
      prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'bulk_delete', 'inventory', ?)`)
        .run(generateId(), req.user!.userId, id);
    }

    return result.changes;
  });
  res.json({ message: `${deleted} items deleted successfully`, deleted });
});

router.get('/export/csv', authenticate, (_req: Request, res: Response) => {

  const items = prepare(`
    SELECT sku, name_en, name_mm, category, quantity, unit, min_stock,
           warehouse_name, unit_price, supplier_name, stock_status, last_updated
    FROM inventory_items ORDER BY sku
  `).all() as any[];

  const headers = 'SKU,Name (EN),Name (MM),Category,Quantity,Unit,Min Stock,Warehouse,Unit Price,Supplier,Status,Last Updated\n';
  const rows = items.map(i =>
    [i.sku, i.name_en, i.name_mm, i.category, i.quantity, i.unit, i.min_stock, i.warehouse_name, i.unit_price, i.supplier_name, i.stock_status, i.last_updated]
      .map(csvSafeValue).join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=inventory_export.csv');
  res.send(headers + rows);
});

export default router;
