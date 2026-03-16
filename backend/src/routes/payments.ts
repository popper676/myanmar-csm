import { Router, Request, Response } from 'express';
import { prepare } from '../db-wrapper';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPaymentSchema, updatePaymentStatusSchema, paymentQuerySchema } from '../schemas/payments';
import { generateId, generatePaymentId, paginationMeta, csvSafeValue } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', authenticate, validate(paymentQuerySchema, 'query'), (req: Request, res: Response) => {
  const { search, status, page, limit } = req.query as any;


  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (payment_id LIKE ? OR supplier_name LIKE ? OR reference LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const countResult = prepare(`SELECT COUNT(*) as total FROM payments ${whereClause}`).get(...params) as { total: number };
  const offset = ((page || 1) - 1) * (limit || 20);

  const payments = prepare(`
    SELECT id, payment_id as paymentId, supplier_name as supplier, date, amount,
           method, reference as ref, status
    FROM payments ${whereClause}
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit || 20, offset);

  const summary = prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as totalPaid,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as totalPending,
      COALESCE(SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END), 0) as totalFailed,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedCount
    FROM payments
  `).get() as any;

  res.json({
    payments,
    summary: {
      totalPaid: summary.totalPaid,
      totalPending: summary.totalPending,
      totalFailed: summary.totalFailed,
      pendingCount: summary.pendingCount,
      failedCount: summary.failedCount,
    },
    pagination: paginationMeta(countResult.total, page || 1, limit || 20),
  });
});

router.get('/export/csv', authenticate, (_req: Request, res: Response) => {

  const payments = prepare(`
    SELECT payment_id, supplier_name, date, amount, method, reference, status
    FROM payments ORDER BY date DESC
  `).all() as any[];

  const headers = 'Payment ID,Supplier,Date,Amount,Method,Reference,Status\n';
  const rows = payments.map(p =>
    [p.payment_id, p.supplier_name, p.date, p.amount, p.method, p.reference || '', p.status]
      .map(csvSafeValue).join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=payments_export.csv');
  res.send(headers + rows);
});

router.get('/:id', authenticate, (req: Request, res: Response) => {

  const payment = prepare(`
    SELECT id, payment_id as paymentId, supplier_name as supplier, date, amount,
           method, reference as ref, status
    FROM payments WHERE id = ?
  `).get(req.params.id);

  if (!payment) throw new AppError(404, 'Payment not found');
  res.json(payment);
});

router.post('/', authenticate, authorize('admin', 'manager'), validate(createPaymentSchema), (req: Request, res: Response) => {

  const { supplierName, date, amount, method, reference, status: payStatus } = req.body;

  const id = generateId();
  const paymentId = generatePaymentId();

  prepare(`
    INSERT INTO payments (id, payment_id, supplier_name, date, amount, method, reference, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, paymentId, supplierName, date, amount, method, reference || '', payStatus || 'pending');

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'create', 'payment', ?)`)
    .run(generateId(), req.user!.userId, id);

  const payment = prepare(`
    SELECT id, payment_id as paymentId, supplier_name as supplier, date, amount,
           method, reference as ref, status
    FROM payments WHERE id = ?
  `).get(id);

  res.status(201).json(payment);
});

router.patch('/:id/status', authenticate, authorize('admin', 'manager'), validate(updatePaymentStatusSchema), (req: Request, res: Response) => {

  const { id } = req.params;
  const { status } = req.body;

  const existing = prepare('SELECT id FROM payments WHERE id = ?').get(id);
  if (!existing) throw new AppError(404, 'Payment not found');

  prepare('UPDATE payments SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, id);

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, 'status_change', 'payment', ?, ?)`)
    .run(generateId(), req.user!.userId, id, JSON.stringify({ status }));

  res.json({ message: 'Payment status updated' });
});

router.delete('/:id', authenticate, authorize('admin'), (req: Request, res: Response) => {

  const result = prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  if (result.changes === 0) throw new AppError(404, 'Payment not found');
  res.json({ message: 'Payment deleted successfully' });
});

export default router;
