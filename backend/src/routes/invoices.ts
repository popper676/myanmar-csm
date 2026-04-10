import { Router, Request, Response } from 'express';
import { prepare } from '../db-wrapper';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { invoiceQuerySchema, updateInvoiceStatusSchema } from '../schemas/invoices';
import { AppError } from '../middleware/errorHandler';
import { generateId, paginationMeta } from '../utils/helpers';

const router = Router();

router.get('/', authenticate, validate(invoiceQuerySchema, 'query'), (req: Request, res: Response) => {
  const { status, search, page, limit } = req.query as any;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  if (status && status !== 'all') {
    whereClause += ' AND i.status = ?';
    params.push(status);
  }
  if (search) {
    whereClause += ' AND (i.invoice_number LIKE ? OR i.customer_name LIKE ? OR s.so_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const countResult = prepare(`
    SELECT COUNT(*) as total
    FROM invoices i
    LEFT JOIN sales_orders s ON s.id = i.sales_order_id
    ${whereClause}
  `).get(...params) as { total: number };

  const offset = ((page || 1) - 1) * (limit || 20);
  const invoices = prepare(`
    SELECT i.id, i.invoice_number as invoiceNumber, i.sales_order_id as salesOrderId, s.so_number as soNumber,
           i.customer_name as customerName, i.issue_date as issueDate, i.due_date as dueDate,
           i.total_amount as totalAmount, i.paid_amount as paidAmount, i.status
    FROM invoices i
    LEFT JOIN sales_orders s ON s.id = i.sales_order_id
    ${whereClause}
    ORDER BY i.issue_date DESC, i.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit || 20, offset);

  const summary = prepare(`
    SELECT
      COALESCE(SUM(total_amount), 0) as totalInvoiced,
      COALESCE(SUM(paid_amount), 0) as totalCollected,
      COALESCE(SUM(total_amount - paid_amount), 0) as totalOutstanding
    FROM invoices
    WHERE status != 'cancelled'
  `).get() as any;

  res.json({
    invoices,
    summary,
    pagination: paginationMeta(countResult.total, page || 1, limit || 20),
  });
});

router.get('/:id', authenticate, (req: Request, res: Response) => {
  const invoice = prepare(`
    SELECT i.id, i.invoice_number as invoiceNumber, i.sales_order_id as salesOrderId, s.so_number as soNumber,
           i.customer_name as customerName, i.issue_date as issueDate, i.due_date as dueDate,
           i.total_amount as totalAmount, i.paid_amount as paidAmount, i.status
    FROM invoices i
    LEFT JOIN sales_orders s ON s.id = i.sales_order_id
    WHERE i.id = ?
  `).get(req.params.id);
  if (!invoice) throw new AppError(404, 'Invoice not found');
  res.json(invoice);
});

router.patch('/:id/status', authenticate, authorize('admin', 'manager'), validate(updateInvoiceStatusSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, paidAmount } = req.body as any;

  const existing = prepare(`
    SELECT id, total_amount as totalAmount, paid_amount as paidAmount, invoice_number as invoiceNumber
    FROM invoices WHERE id = ?
  `).get(id) as any;
  if (!existing) throw new AppError(404, 'Invoice not found');

  const nextPaid = paidAmount != null ? Number(paidAmount) : Number(existing.paidAmount);
  if (nextPaid < 0 || nextPaid > Number(existing.totalAmount)) {
    throw new AppError(400, 'Invalid paid amount');
  }

  prepare(`
    UPDATE invoices
    SET status = ?, paid_amount = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, nextPaid, id);

  if (nextPaid > Number(existing.paidAmount)) {
    const delta = nextPaid - Number(existing.paidAmount);
    prepare(`
      INSERT INTO accounting_entries (id, entry_type, category, reference_type, reference_id, amount, description, entry_date)
      VALUES (?, 'inflow', 'invoice_payment', 'invoice', ?, ?, ?, date('now'))
    `).run(generateId(), id, delta, `Invoice ${existing.invoiceNumber} payment`);
  }

  prepare(`
    INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details)
    VALUES (?, ?, 'status_change', 'invoice', ?, ?)
  `).run(generateId(), req.user!.userId, id, JSON.stringify({ status, paidAmount: nextPaid }));

  res.json({ message: 'Invoice updated successfully' });
});

export default router;
