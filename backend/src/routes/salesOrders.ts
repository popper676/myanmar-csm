import { Router, Request, Response } from 'express';
import { prepare, transaction } from '../db-wrapper';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSalesOrderSchema, salesOrderQuerySchema, updateSalesOrderStatusSchema } from '../schemas/salesOrders';
import { AppError } from '../middleware/errorHandler';
import { computeStockStatus, generateId, generateInvoiceNumber, generateSoNumber, paginationMeta } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, validate(salesOrderQuerySchema, 'query'), (req: Request, res: Response) => {
  const { status, search, page, limit } = req.query as any;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    whereClause += ' AND (so_number LIKE ? OR customer_name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  const countResult = prepare(`SELECT COUNT(*) as total FROM sales_orders ${whereClause}`).get(...params) as { total: number };
  const offset = ((page || 1) - 1) * (limit || 20);

  const orders = prepare(`
    SELECT id, so_number as soNumber, customer_name as customerName, order_date as orderDate,
           total_amount as totalAmount, items_count as itemsCount, status, notes,
           created_at as createdAt, updated_at as updatedAt
    FROM sales_orders ${whereClause}
    ORDER BY order_date DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit || 20, offset);

  res.json({
    orders,
    pagination: paginationMeta(countResult.total, page || 1, limit || 20),
  });
});

router.get('/:id', authenticate, (req: Request, res: Response) => {
  const order = prepare(`
    SELECT id, so_number as soNumber, customer_name as customerName, order_date as orderDate,
           total_amount as totalAmount, items_count as itemsCount, status, notes
    FROM sales_orders WHERE id = ?
  `).get(req.params.id) as any;
  if (!order) throw new AppError(404, 'Sales order not found');

  const items = prepare(`
    SELECT id, inventory_item_id as inventoryItemId, sku, name, qty, unit_price as unitPrice, total
    FROM sales_order_items WHERE so_id = ?
  `).all(req.params.id);

  const invoice = prepare(`
    SELECT id, invoice_number as invoiceNumber, status, total_amount as totalAmount, paid_amount as paidAmount
    FROM invoices WHERE sales_order_id = ?
  `).get(req.params.id);

  res.json({ ...order, items, invoice: invoice || null });
});

router.post('/', authenticate, authorize('admin', 'manager', 'staff'), validate(createSalesOrderSchema), (req: Request, res: Response) => {
  const { customerName, orderDate, notes, items } = req.body as any;

  // Strict inventory check before processing sales order
  const inventoryRows = items.map((item: any) => {
    const row = prepare(`
      SELECT id, sku, name_en as nameEn, quantity, min_stock as minStock, unit_price as unitPrice
      FROM inventory_items WHERE id = ?
    `).get(item.inventoryItemId) as any;
    if (!row) throw new AppError(404, `Inventory item not found: ${item.inventoryItemId}`);
    if (Number(row.quantity) < Number(item.qty)) {
      throw new AppError(400, `Insufficient stock for ${row.nameEn} (${row.sku}). Available: ${row.quantity}, Required: ${item.qty}`);
    }
    return row;
  });

  const soId = generateId();
  const soNumber = generateSoNumber();
  const invoiceId = generateId();
  const invoiceNumber = generateInvoiceNumber();

  let totalAmount = 0;

  transaction(() => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const inv = inventoryRows[i];
      const unitPrice = item.unitPrice ?? inv.unitPrice ?? 0;
      const lineTotal = Number(item.qty) * Number(unitPrice);
      totalAmount += lineTotal;

      const newQty = Number(inv.quantity) - Number(item.qty);
      prepare(`
        UPDATE inventory_items
        SET quantity = ?, stock_status = ?, last_updated = datetime('now')
        WHERE id = ?
      `).run(newQty, computeStockStatus(newQty, Number(inv.minStock)), inv.id);

      prepare(`
        INSERT INTO sales_order_items (id, so_id, inventory_item_id, sku, name, qty, unit_price, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(generateId(), soId, inv.id, inv.sku, inv.nameEn, item.qty, unitPrice, lineTotal);

      prepare(`
        INSERT INTO inventory_movements (id, item_id, movement_type, qty, unit_cost, reference_type, reference_id, notes)
        VALUES (?, ?, 'out', ?, ?, 'sales_order', ?, ?)
      `).run(generateId(), inv.id, item.qty, unitPrice, soId, `SO ${soNumber}`);
    }

    prepare(`
      INSERT INTO sales_orders (id, so_number, customer_name, order_date, total_amount, items_count, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'fulfilled', ?, ?)
    `).run(soId, soNumber, customerName, orderDate, totalAmount, items.length, notes || null, req.user!.userId);

    prepare(`
      INSERT INTO invoices (id, invoice_number, sales_order_id, customer_name, issue_date, due_date, total_amount, paid_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'unpaid')
    `).run(invoiceId, invoiceNumber, soId, customerName, orderDate, orderDate, totalAmount);

    prepare(`
      INSERT INTO accounting_entries (id, entry_type, category, reference_type, reference_id, amount, description, entry_date)
      VALUES (?, 'inflow', 'sales', 'sales_order', ?, ?, ?, ?)
    `).run(generateId(), soId, totalAmount, `SO ${soNumber} fulfilled`, orderDate);

    prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'create', 'sales_order', ?)`)
      .run(generateId(), req.user!.userId, soId);
  });

  const order = prepare(`
    SELECT id, so_number as soNumber, customer_name as customerName, order_date as orderDate,
           total_amount as totalAmount, items_count as itemsCount, status
    FROM sales_orders WHERE id = ?
  `).get(soId);

  res.status(201).json({ ...order, invoiceNumber });
});

router.patch('/:id/status', authenticate, authorize('admin', 'manager'), validate(updateSalesOrderStatusSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as any;

  const existing = prepare('SELECT id, status FROM sales_orders WHERE id = ?').get(id) as any;
  if (!existing) throw new AppError(404, 'Sales order not found');

  if (existing.status === 'fulfilled' || existing.status === 'cancelled') {
    throw new AppError(400, `Cannot change status from '${existing.status}'`);
  }
  if (status === 'fulfilled') {
    throw new AppError(400, 'Create a new sales order to fulfill inventory. This order can only be draft/confirmed/cancelled.');
  }

  prepare('UPDATE sales_orders SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, id);
  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, 'status_change', 'sales_order', ?, ?)`)
    .run(generateId(), req.user!.userId, id, JSON.stringify({ from: existing.status, to: status }));

  res.json({ message: 'Sales order status updated' });
});

export default router;
