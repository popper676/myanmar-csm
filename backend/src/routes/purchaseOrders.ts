import { Router, Request, Response } from 'express';
import { prepare, transaction } from '../db-wrapper';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, updatePurchaseOrderStatusSchema, purchaseOrderQuerySchema } from '../schemas/purchaseOrders';
import { computeStockStatus, generateId, generatePoNumber } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();

function applyPurchaseReceipt(poId: string, userId: string): void {
  const alreadyPosted = prepare('SELECT id FROM purchase_receipts WHERE po_id = ?').get(poId) as any;
  if (alreadyPosted) return;

  const order = prepare(`
    SELECT id, po_number as poNumber, supplier_name as supplierName, warehouse, total_amount as totalAmount
    FROM purchase_orders WHERE id = ?
  `).get(poId) as any;
  if (!order) throw new AppError(404, 'Purchase order not found');

  const items = prepare(`
    SELECT name, qty, unit_price as unitPrice
    FROM purchase_order_items WHERE po_id = ?
  `).all(poId) as any[];
  if (items.length === 0) {
    throw new AppError(400, 'Cannot receive PO with no items');
  }

  for (const item of items) {
    const existing = prepare(`
      SELECT id, sku, quantity, min_stock as minStock
      FROM inventory_items
      WHERE name_en = ? OR sku = ?
      LIMIT 1
    `).get(item.name, item.name) as any;

    if (existing) {
      const newQty = Number(existing.quantity) + Number(item.qty);
      prepare(`
        UPDATE inventory_items
        SET quantity = ?, stock_status = ?, last_updated = datetime('now')
        WHERE id = ?
      `).run(newQty, computeStockStatus(newQty, Number(existing.minStock)), existing.id);

      prepare(`
        INSERT INTO inventory_movements (id, item_id, movement_type, qty, unit_cost, reference_type, reference_id, notes)
        VALUES (?, ?, 'in', ?, ?, 'purchase_order', ?, ?)
      `).run(generateId(), existing.id, item.qty, item.unitPrice, poId, `PO Receipt ${order.poNumber}`);
    } else {
      const newId = generateId();
      const sku = `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      prepare(`
        INSERT INTO inventory_items (
          id, sku, name_en, name_mm, category, quantity, unit, min_stock, warehouse_name,
          unit_price, supplier_name, stock_status, last_updated
        ) VALUES (?, ?, ?, '', 'General', ?, 'pcs', 0, ?, ?, ?, ?, datetime('now'))
      `).run(
        newId,
        sku,
        item.name,
        item.qty,
        order.warehouse || 'Yangon Main',
        item.unitPrice,
        order.supplierName,
        computeStockStatus(Number(item.qty), 0),
      );

      prepare(`
        INSERT INTO inventory_movements (id, item_id, movement_type, qty, unit_cost, reference_type, reference_id, notes)
        VALUES (?, ?, 'in', ?, ?, 'purchase_order', ?, ?)
      `).run(generateId(), newId, item.qty, item.unitPrice, poId, `PO Receipt ${order.poNumber}`);
    }
  }

  prepare(`
    INSERT INTO accounting_entries (id, entry_type, category, reference_type, reference_id, amount, description, entry_date)
    VALUES (?, 'outflow', 'procurement', 'purchase_order', ?, ?, ?, date('now'))
  `).run(generateId(), poId, Number(order.totalAmount || 0), `PO ${order.poNumber} stock receipt`);

  prepare(`
    INSERT INTO purchase_receipts (id, po_id, posted_by)
    VALUES (?, ?, ?)
  `).run(generateId(), poId, userId);
}

router.get('/', authenticate, validate(purchaseOrderQuerySchema, 'query'), (req: Request, res: Response) => {
  const { status, search, page, limit } = req.query as any;


  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    whereClause += ' AND (po_number LIKE ? OR supplier_name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  const countResult = prepare(`SELECT COUNT(*) as total FROM purchase_orders ${whereClause}`).get(...params) as { total: number };

  const offset = ((page || 1) - 1) * (limit || 20);
  const orders = prepare(`
    SELECT id, po_number as poNumber, supplier_name as supplier, order_date as orderDate,
           expected_delivery as expectedDelivery, total_amount as totalAmount,
           items_count as itemsCount, status, warehouse, notes,
           created_at as createdAt, updated_at as updatedAt
    FROM purchase_orders ${whereClause}
    ORDER BY order_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit || 20, offset);

  const statusCounts = prepare(`
    SELECT status, COUNT(*) as count FROM purchase_orders GROUP BY status
  `).all();

  res.json({
    orders,
    statusCounts: Object.fromEntries((statusCounts as any[]).map(s => [s.status, s.count])),
    pagination: {
      total: countResult.total,
      page: page || 1,
      limit: limit || 20,
      totalPages: Math.ceil(countResult.total / (limit || 20)),
    },
  });
});

router.get('/:id', authenticate, (req: Request, res: Response) => {

  const order = prepare(`
    SELECT id, po_number as poNumber, supplier_name as supplier, order_date as orderDate,
           expected_delivery as expectedDelivery, total_amount as totalAmount,
           items_count as itemsCount, status, warehouse, notes
    FROM purchase_orders WHERE id = ?
  `).get(req.params.id) as any;

  if (!order) throw new AppError(404, 'Purchase order not found');

  const items = prepare(`
    SELECT id, name, qty, unit_price as unitPrice, total FROM purchase_order_items WHERE po_id = ?
  `).all(req.params.id);

  res.json({ ...order, items });
});

router.post('/', authenticate, authorize('admin', 'manager'), validate(createPurchaseOrderSchema), (req: Request, res: Response) => {

  const { supplierName, orderDate, expectedDelivery, warehouse, notes, items } = req.body;

  const totalAmount = items.reduce((sum: number, item: any) => sum + item.qty * item.unitPrice, 0);
  const poNumber = generatePoNumber();
  const poId = generateId();

  transaction(() => {
    prepare(`
      INSERT INTO purchase_orders (id, po_number, supplier_name, order_date, expected_delivery, total_amount, items_count, status, warehouse, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(poId, poNumber, supplierName, orderDate, expectedDelivery || null, totalAmount, items.length, warehouse || null, notes || null, req.user!.userId);

    for (const item of items) {
      prepare(`
        INSERT INTO purchase_order_items (id, po_id, name, qty, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId(), poId, item.name, item.qty, item.unitPrice, item.qty * item.unitPrice);
    }

    prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'create', 'purchase_order', ?)`)
      .run(generateId(), req.user!.userId, poId);
  });

  const order = prepare(`
    SELECT id, po_number as poNumber, supplier_name as supplier, order_date as orderDate,
           expected_delivery as expectedDelivery, total_amount as totalAmount,
           items_count as itemsCount, status
    FROM purchase_orders WHERE id = ?
  `).get(poId);

  res.status(201).json(order);
});

router.put('/:id', authenticate, authorize('admin', 'manager'), validate(updatePurchaseOrderSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const { supplierName, orderDate, expectedDelivery, warehouse, notes, items } = req.body;

  const existing = prepare('SELECT id, status FROM purchase_orders WHERE id = ?').get(id) as any;
  if (!existing) throw new AppError(404, 'Purchase order not found');
  if (!['pending', 'approved'].includes(existing.status)) {
    throw new AppError(400, 'Only pending or approved orders can be edited');
  }

  transaction(() => {
    const updates: string[] = [];
    const params: any[] = [];

    if (supplierName !== undefined) { updates.push('supplier_name = ?'); params.push(supplierName); }
    if (orderDate !== undefined) { updates.push('order_date = ?'); params.push(orderDate); }
    if (expectedDelivery !== undefined) { updates.push('expected_delivery = ?'); params.push(expectedDelivery || null); }
    if (warehouse !== undefined) { updates.push('warehouse = ?'); params.push(warehouse); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes || null); }

    if (items && items.length > 0) {
      const totalAmount = items.reduce((sum: number, item: any) => sum + item.qty * item.unitPrice, 0);
      updates.push('total_amount = ?', 'items_count = ?');
      params.push(totalAmount, items.length);

      prepare('DELETE FROM purchase_order_items WHERE po_id = ?').run(id);
      for (const item of items) {
        prepare('INSERT INTO purchase_order_items (id, po_id, name, qty, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)')
          .run(generateId(), id, item.name, item.qty, item.unitPrice, item.qty * item.unitPrice);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      params.push(id);
      prepare(`UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'update', 'purchase_order', ?)`)
      .run(generateId(), req.user!.userId, id);
  });

  const order = prepare(`
    SELECT id, po_number as poNumber, supplier_name as supplier, order_date as orderDate,
           expected_delivery as expectedDelivery, total_amount as totalAmount,
           items_count as itemsCount, status, warehouse, notes
    FROM purchase_orders WHERE id = ?
  `).get(id);

  res.json(order);
});

router.patch('/:id/status', authenticate, authorize('admin', 'manager'), validate(updatePurchaseOrderStatusSchema), (req: Request, res: Response) => {

  const { id } = req.params;
  const { status } = req.body;

  const existing = prepare('SELECT id, status FROM purchase_orders WHERE id = ?').get(id) as any;
  if (!existing) throw new AppError(404, 'Purchase order not found');

  const validTransitions: Record<string, string[]> = {
    pending: ['approved', 'cancelled'],
    approved: ['confirmed', 'cancelled'],
    confirmed: ['received', 'cancelled'],
    received: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  if (!validTransitions[existing.status]?.includes(status)) {
    throw new AppError(400, `Cannot transition from '${existing.status}' to '${status}'`);
  }

  transaction(() => {
    prepare('UPDATE purchase_orders SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, id);

    if ((status === 'received' || status === 'delivered') && existing.status !== 'received' && existing.status !== 'delivered') {
      applyPurchaseReceipt(String(id), String(req.user!.userId));
    }

    prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, 'status_change', 'purchase_order', ?, ?)`)
      .run(generateId(), req.user!.userId, id, JSON.stringify({ from: existing.status, to: status }));
  });

  const order = prepare(`
    SELECT id, po_number as poNumber, supplier_name as supplier, order_date as orderDate,
           expected_delivery as expectedDelivery, total_amount as totalAmount,
           items_count as itemsCount, status
    FROM purchase_orders WHERE id = ?
  `).get(id);

  res.json(order);
});

router.delete('/:id', authenticate, authorize('admin'), (req: Request, res: Response) => {

  const result = prepare('DELETE FROM purchase_orders WHERE id = ?').run(req.params.id);
  if (result.changes === 0) throw new AppError(404, 'Purchase order not found');

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'delete', 'purchase_order', ?)`)
    .run(generateId(), req.user!.userId, req.params.id);

  res.json({ message: 'Purchase order deleted successfully' });
});

export default router;
