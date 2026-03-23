import { Router, Request, Response } from 'express';
import { prepare, transaction } from '../db-wrapper';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createShipmentSchema, updateShipmentStatusSchema, shipmentQuerySchema } from '../schemas/shipments';
import { generateId, generateShipmentId, generateTrackingNumber } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', authenticate, validate(shipmentQuerySchema, 'query'), (req: Request, res: Response) => {
  const { status, search } = req.query as any;


  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND s.status = ?';
    params.push(status);
  }
  if (search) {
    whereClause += ' AND (s.shipment_id LIKE ? OR s.carrier LIKE ? OR s.tracking_number LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  const shipments = prepare(`
    SELECT s.id, s.shipment_id as shipmentId, s.from_en as fromEn, s.from_mm as fromMm,
           s.to_en as toEn, s.to_mm as toMm, s.carrier, s.dispatch_date as dispatchDate,
           s.eta, s.status, s.tracking_number as trackingNumber,
           s.days_remaining as daysRemaining
    FROM shipments s ${whereClause}
    ORDER BY s.dispatch_date DESC
  `).all(...params) as any[];

  for (const shipment of shipments) {
    const items = prepare('SELECT description FROM shipment_items WHERE shipment_id = ?').all(shipment.id) as any[];
    shipment.from = { en: shipment.fromEn, mm: shipment.fromMm };
    shipment.to = { en: shipment.toEn, mm: shipment.toMm };
    shipment.items = items.map(i => i.description);
    delete shipment.fromEn;
    delete shipment.fromMm;
    delete shipment.toEn;
    delete shipment.toMm;
  }

  res.json(shipments);
});

router.get('/cities', authenticate, (_req: Request, res: Response) => {
  // lat/lng approximations for OpenStreetMap — legacy x/y kept for any old clients
  res.json([
    { en: 'Yangon', mm: 'ရန်ကုန်', x: 50, y: 80, lat: 16.866, lng: 96.195 },
    { en: 'Bago', mm: 'ပဲခူး', x: 55, y: 70, lat: 17.335, lng: 96.481 },
    { en: 'Naypyidaw', mm: 'နေပြည်တော်', x: 50, y: 50, lat: 19.763, lng: 96.079 },
    { en: 'Mandalay', mm: 'မန္တလေး', x: 52, y: 30, lat: 21.959, lng: 96.089 },
    { en: 'Mawlamyine', mm: 'မော်လမြိုင်', x: 65, y: 75, lat: 16.491, lng: 97.628 },
    { en: 'Taunggyi', mm: 'တောင်ကြီး', x: 70, y: 45, lat: 20.789, lng: 97.038 },
  ]);
});

router.get('/:id', authenticate, (req: Request, res: Response) => {

  const shipment = prepare(`
    SELECT id, shipment_id as shipmentId, from_en, from_mm, to_en, to_mm,
           carrier, dispatch_date as dispatchDate, eta, status,
           tracking_number as trackingNumber, days_remaining as daysRemaining
    FROM shipments WHERE id = ?
  `).get(req.params.id) as any;

  if (!shipment) throw new AppError(404, 'Shipment not found');

  const items = prepare('SELECT description FROM shipment_items WHERE shipment_id = ?').all(req.params.id) as any[];
  shipment.from = { en: shipment.from_en, mm: shipment.from_mm };
  shipment.to = { en: shipment.to_en, mm: shipment.to_mm };
  shipment.items = items.map(i => i.description);
  delete shipment.from_en;
  delete shipment.from_mm;
  delete shipment.to_en;
  delete shipment.to_mm;

  res.json(shipment);
});

router.post('/', authenticate, authorize('admin', 'manager', 'staff'), validate(createShipmentSchema), (req: Request, res: Response) => {

  const { fromEn, fromMm, toEn, toMm, carrier, dispatchDate, eta, items } = req.body;

  const id = generateId();
  const shipmentId = generateShipmentId();
  const trackingNumber = generateTrackingNumber(carrier);

  const dispatchMs = new Date(dispatchDate).getTime();
  const etaMs = new Date(eta).getTime();
  const daysRemaining = Math.max(0, Math.ceil((etaMs - Date.now()) / (1000 * 60 * 60 * 24)));

  transaction(() => {
    prepare(`
      INSERT INTO shipments (id, shipment_id, from_en, from_mm, to_en, to_mm, carrier, dispatch_date, eta, status, tracking_number, days_remaining)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ordered', ?, ?)
    `).run(id, shipmentId, fromEn, fromMm || '', toEn, toMm || '', carrier, dispatchDate, eta, trackingNumber, daysRemaining);

    if (items && items.length > 0) {
      for (const item of items) {
        prepare('INSERT INTO shipment_items (id, shipment_id, description) VALUES (?, ?, ?)')
          .run(generateId(), id, item);
      }
    }

    prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'create', 'shipment', ?)`)
      .run(generateId(), req.user!.userId, id);
  });

  res.status(201).json({ id, shipmentId, trackingNumber, status: 'ordered' });
});

router.patch('/:id/status', authenticate, authorize('admin', 'manager'), validate(updateShipmentStatusSchema), (req: Request, res: Response) => {

  const { id } = req.params;
  const { status } = req.body;

  const existing = prepare('SELECT id, status FROM shipments WHERE id = ?').get(id) as any;
  if (!existing) throw new AppError(404, 'Shipment not found');

  const validTransitions: Record<string, string[]> = {
    ordered: ['dispatched'],
    dispatched: ['in_transit'],
    in_transit: ['customs', 'delivered'],
    customs: ['delivered'],
    delivered: [],
  };

  if (!validTransitions[existing.status]?.includes(status)) {
    throw new AppError(400, `Cannot transition from '${existing.status}' to '${status}'`);
  }

  const daysRemaining = status === 'delivered' ? 0 : undefined;
  if (daysRemaining !== undefined) {
    prepare('UPDATE shipments SET status = ?, days_remaining = 0, updated_at = datetime("now") WHERE id = ?').run(status, id);
  } else {
    prepare('UPDATE shipments SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, id);
  }

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, 'status_change', 'shipment', ?, ?)`)
    .run(generateId(), req.user!.userId, id, JSON.stringify({ from: existing.status, to: status }));

  res.json({ message: 'Status updated successfully' });
});

router.delete('/:id', authenticate, authorize('admin'), (req: Request, res: Response) => {

  const result = prepare('DELETE FROM shipments WHERE id = ?').run(req.params.id);
  if (result.changes === 0) throw new AppError(404, 'Shipment not found');
  res.json({ message: 'Shipment deleted successfully' });
});

export default router;
