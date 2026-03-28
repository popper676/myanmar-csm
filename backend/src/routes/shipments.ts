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
  res.json([
    { en: 'Yangon',      mm: 'ရန်ကုန်',     lat: 16.8661, lng: 96.1951, country: 'MM' },
    { en: 'Bago',        mm: 'ပဲခူး',       lat: 17.3352, lng: 96.4814, country: 'MM' },
    { en: 'Naypyidaw',   mm: 'နေပြည်တော်',  lat: 19.7633, lng: 96.0785, country: 'MM' },
    { en: 'Mandalay',    mm: 'မန္တလေး',     lat: 21.9588, lng: 96.0891, country: 'MM' },
    { en: 'Mawlamyine',  mm: 'မော်လမြိုင်', lat: 16.4905, lng: 97.6285, country: 'MM' },
    { en: 'Taunggyi',    mm: 'တောင်ကြီး',   lat: 20.7893, lng: 97.0378, country: 'MM' },
    { en: 'Myitkyina',   mm: 'မြစ်ကြီးနား', lat: 25.3867, lng: 97.3958, country: 'MM' },
    { en: 'Pathein',     mm: 'ပုသိမ်',      lat: 16.7792, lng: 94.7326, country: 'MM' },
    { en: 'Sagaing',     mm: 'စစ်ကိုင်း',   lat: 21.8787, lng: 95.9785, country: 'MM' },
    { en: 'Lashio',      mm: 'လားရှိုး',     lat: 22.9362, lng: 97.7499, country: 'MM' },
    { en: 'Meiktila',    mm: 'မိတ္ထီလာ',    lat: 20.8814, lng: 95.8585, country: 'MM' },
    { en: 'Pyay',        mm: 'ပြည်',        lat: 18.8240, lng: 95.2218, country: 'MM' },
    { en: 'Magway',      mm: 'မကွေး',       lat: 20.1487, lng: 94.9196, country: 'MM' },
    { en: 'Dawei',       mm: 'ထားဝယ်',      lat: 14.0823, lng: 98.1915, country: 'MM' },
    { en: 'Sittwe',      mm: 'စစ်တွေ',      lat: 20.1461, lng: 92.8984, country: 'MM' },
    { en: 'Monywa',      mm: 'မုံရွာ',       lat: 21.9139, lng: 95.1335, country: 'MM' },
    { en: 'Myeik',       mm: 'မြိတ်',       lat: 12.4394, lng: 98.6006, country: 'MM' },
    { en: 'Hakha',       mm: 'ဟားခါး',      lat: 22.6415, lng: 93.6162, country: 'MM' },
    { en: 'Loikaw',      mm: 'လွိုင်ကော်',  lat: 19.6747, lng: 97.2099, country: 'MM' },
    { en: 'Bangkok',              mm: 'ဘန်ကောက်',       lat: 13.7563, lng: 100.5018, country: 'TH' },
    { en: 'Chiang Mai',           mm: 'ချင်းမိုင်',       lat: 18.7883, lng: 98.9853,  country: 'TH' },
    { en: 'Chiang Rai',           mm: 'ချင်းရိုင်',       lat: 19.9105, lng: 99.8406,  country: 'TH' },
    { en: 'Mae Sot',              mm: 'မဲဆောက်',        lat: 16.7130, lng: 98.5708,  country: 'TH' },
    { en: 'Hat Yai',              mm: 'ဟတ်ယိုင်',        lat: 7.0040,  lng: 100.4747, country: 'TH' },
    { en: 'Nakhon Ratchasima',    mm: 'နခုန်ရာချစီမာ',    lat: 14.9799, lng: 102.0978, country: 'TH' },
    { en: 'Phuket',               mm: 'ဖူးခက်',          lat: 7.8804,  lng: 98.3923,  country: 'TH' },
    { en: 'Khon Kaen',            mm: 'ခွန်ကဲန်',        lat: 16.4322, lng: 102.8236, country: 'TH' },
    { en: 'Ranong',               mm: 'ရနောင်း',         lat: 9.9625,  lng: 98.6385,  country: 'TH' },
    { en: 'Kunming',   mm: 'ကူမင်း',     lat: 25.0389, lng: 102.7183, country: 'CN' },
    { en: 'Ruili',     mm: 'ရွှေလီ',      lat: 24.0131, lng: 97.8561,  country: 'CN' },
    { en: 'Guangzhou',  mm: 'ကွမ်ကျိုး',   lat: 23.1291, lng: 113.2644, country: 'CN' },
    { en: 'Shenzhen',  mm: 'ရှင်ကျန်',    lat: 22.5431, lng: 114.0579, country: 'CN' },
    { en: 'Shanghai',  mm: 'ရှန်ဟိုင်း',   lat: 31.2304, lng: 121.4737, country: 'CN' },
    { en: 'Beijing',   mm: 'ပေကျင်း',     lat: 39.9042, lng: 116.4074, country: 'CN' },
    { en: 'Chengdu',   mm: 'ချိန်တူး',     lat: 30.5728, lng: 104.0668, country: 'CN' },
    { en: 'Nanning',   mm: 'နန်နင်း',     lat: 22.8170, lng: 108.3665, country: 'CN' },
    { en: 'Chongqing', mm: 'ချုံကျင့်',    lat: 29.4316, lng: 106.9123, country: 'CN' },
    { en: 'Xiamen',    mm: 'ရှမင်',       lat: 24.4798, lng: 118.0894, country: 'CN' },
  ]);
});

// ─── OSRM road routing proxy (avoids browser CORS) ───

router.get('/route-geometry', authenticate, async (req: Request, res: Response) => {
  const fromLat = parseFloat(String(req.query.fromLat ?? ''));
  const fromLng = parseFloat(String(req.query.fromLng ?? ''));
  const toLat = parseFloat(String(req.query.toLat ?? ''));
  const toLng = parseFloat(String(req.query.toLng ?? ''));
  if ([fromLat, fromLng, toLat, toLng].some((n) => Number.isNaN(n))) {
    res.status(400).json({ error: 'Invalid coordinates' });
    return;
  }

  const straight = (): { coordinates: [number, number][]; fallback: boolean } => ({
    coordinates: [[fromLat, fromLng], [toLat, toLng]],
    fallback: true,
  });

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const r = await fetch(url, { headers: { 'User-Agent': 'myan-supply-flow/1.0' } });
    if (!r.ok) { res.json(straight()); return; }
    const data = (await r.json()) as {
      routes?: { geometry?: { coordinates?: [number, number][] }; distance?: number; duration?: number }[];
    };
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords?.length) { res.json(straight()); return; }
    const latLng: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);
    res.json({
      coordinates: latLng,
      fallback: false,
      distance: data.routes?.[0]?.distance,
      duration: data.routes?.[0]?.duration,
    });
  } catch {
    res.json(straight());
  }
});

// ─── GPS Tracking (must be before /:id to avoid param conflict) ───

router.get('/gps/locations', authenticate, (_req: Request, res: Response) => {
  const rows = prepare(`
    SELECT g.shipment_id as shipmentId, g.lat, g.lng, g.speed, g.heading, g.accuracy,
           g.updated_at as updatedAt
    FROM gps_locations g
    INNER JOIN shipments s ON s.id = g.shipment_id
    WHERE s.status IN ('dispatched','in_transit','customs')
    ORDER BY g.updated_at DESC
  `).all();
  res.json(rows);
});

router.post('/gps/update', authenticate, (req: Request, res: Response) => {
  const { shipmentId, lat, lng, speed, heading, accuracy } = req.body;
  if (!shipmentId || lat == null || lng == null) {
    throw new AppError(400, 'shipmentId, lat, lng are required');
  }

  const shipment = prepare('SELECT id FROM shipments WHERE id = ?').get(shipmentId);
  if (!shipment) throw new AppError(404, 'Shipment not found');

  const existing = prepare('SELECT id FROM gps_locations WHERE shipment_id = ?').get(shipmentId) as any;
  if (existing) {
    prepare(`
      UPDATE gps_locations SET lat = ?, lng = ?, speed = ?, heading = ?, accuracy = ?, updated_at = datetime('now')
      WHERE shipment_id = ?
    `).run(lat, lng, speed ?? null, heading ?? null, accuracy ?? null, shipmentId);
  } else {
    prepare(`
      INSERT INTO gps_locations (id, shipment_id, lat, lng, speed, heading, accuracy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), shipmentId, lat, lng, speed ?? null, heading ?? null, accuracy ?? null);
  }

  res.json({ message: 'GPS location updated' });
});

router.delete('/gps/:shipmentId', authenticate, authorize('admin', 'manager'), (req: Request, res: Response) => {
  prepare('DELETE FROM gps_locations WHERE shipment_id = ?').run(req.params.shipmentId);
  res.json({ message: 'GPS tracking stopped' });
});

// ─── Shipment by ID (must be after /cities and /gps/*) ───

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

  const allStatuses = ['ordered', 'dispatched', 'in_transit', 'customs', 'delivered'];
  if (!allStatuses.includes(status)) {
    throw new AppError(400, `Invalid status: '${status}'`);
  }
  if (existing.status === status) {
    res.json({ message: 'Status unchanged' });
    return;
  }

  if (status === 'delivered') {
    prepare('UPDATE shipments SET status = ?, days_remaining = 0, updated_at = datetime("now") WHERE id = ?').run(status, id);
    prepare('DELETE FROM gps_locations WHERE shipment_id = ?').run(id);
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
  prepare('DELETE FROM gps_locations WHERE shipment_id = ?').run(req.params.id);
  res.json({ message: 'Shipment deleted successfully' });
});

export default router;
