import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { prepare, transaction } from '../db-wrapper';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  updateCompanySchema, createWarehouseSchema, updateWarehouseSchema,
  createUserSchema, updateUserSchema, updateNotificationsSchema, updatePermissionsSchema,
} from '../schemas/settings';
import { generateId } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

const router = Router();

const storage = multer.diskStorage({
  destination: config.upload.dir,
  filename: (_req, file, cb) => {
    const safeName = path.basename(file.originalname);
    const ext = path.extname(safeName).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.svg', '.webp'];
    if (!allowed.includes(ext)) {
      return cb(new Error('Invalid file type'), '');
    }
    cb(null, `logo-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// === Company Profile ===
router.get('/company', authenticate, (_req: Request, res: Response) => {

  const company = prepare('SELECT * FROM company_settings WHERE id = ?').get('default') as any;
  if (!company) {
    res.json({ name: '', phone: '', email: '', address: '', currency: 'MMK', language: 'en_mm', fiscalYearStart: 'January' });
    return;
  }
  res.json({
    name: company.name,
    phone: company.phone,
    email: company.email,
    address: company.address,
    currency: company.currency,
    language: company.language,
    fiscalYearStart: company.fiscal_year_start,
    logoPath: company.logo_path,
  });
});

router.put('/company', authenticate, authorize('admin'), validate(updateCompanySchema), (req: Request, res: Response) => {

  const fields: string[] = [];
  const values: any[] = [];
  const fieldMap: Record<string, string> = {
    name: 'name', phone: 'phone', email: 'email', address: 'address',
    currency: 'currency', language: 'language', fiscalYearStart: 'fiscal_year_start',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (req.body[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(req.body[key]);
    }
  }

  if (fields.length > 0) {
    fields.push('updated_at = datetime("now")');
    prepare(`UPDATE company_settings SET ${fields.join(', ')} WHERE id = 'default'`).run(...values);
  }

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'update', 'company_settings', 'default')`)
    .run(generateId(), req.user!.userId);

  res.json({ message: 'Company settings updated' });
});

router.post('/company/logo', authenticate, authorize('admin'), upload.single('logo'), (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No file uploaded');

  prepare("UPDATE company_settings SET logo_path = ?, updated_at = datetime('now') WHERE id = 'default'")
    .run(`/uploads/${req.file.filename}`);
  res.json({ logoPath: `/uploads/${req.file.filename}` });
});

// === Users ===
router.get('/users', authenticate, authorize('admin'), (_req: Request, res: Response) => {

  const users = prepare(`
    SELECT id, username, email, full_name as fullName, role, department,
           status, last_login as lastLogin, created_at as createdAt
    FROM users ORDER BY full_name ASC
  `).all();
  res.json(users);
});

router.post('/users', authenticate, authorize('admin'), validate(createUserSchema), (req: Request, res: Response) => {

  const { username, email, password, fullName, role, department } = req.body;

  const existingUser = prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) throw new AppError(409, 'Username or email already exists');

  const id = generateId();
  const passwordHash = bcrypt.hashSync(password, 12);

  prepare(`
    INSERT INTO users (id, username, email, password_hash, full_name, role, department)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, username, email, passwordHash, fullName, role, department || null);

  prepare(`INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)`).run(generateId(), id);

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'create', 'user', ?)`)
    .run(generateId(), req.user!.userId, id);

  res.status(201).json({
    id,
    username,
    email,
    fullName,
    role,
    department,
    status: 'active',
  });
});

router.put('/users/:id', authenticate, authorize('admin'), validate(updateUserSchema), (req: Request, res: Response) => {

  const { id } = req.params;

  const existing = prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) throw new AppError(404, 'User not found');

  const fields: string[] = [];
  const values: any[] = [];
  const fieldMap: Record<string, string> = {
    fullName: 'full_name', role: 'role', department: 'department', status: 'status',
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

  prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'update', 'user', ?)`)
    .run(generateId(), req.user!.userId, id);

  res.json({ message: 'User updated successfully' });
});

router.delete('/users/:id', authenticate, authorize('admin'), (req: Request, res: Response) => {

  if (req.params.id === req.user!.userId) throw new AppError(400, 'Cannot delete your own account');

  const result = prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (result.changes === 0) throw new AppError(404, 'User not found');
  res.json({ message: 'User deleted successfully' });
});

// === Warehouses ===
router.get('/warehouses', authenticate, (_req: Request, res: Response) => {

  const warehouses = prepare(`
    SELECT id, name, location, capacity, manager FROM warehouses ORDER BY name ASC
  `).all();
  res.json(warehouses);
});

router.post('/warehouses', authenticate, authorize('admin'), validate(createWarehouseSchema), (req: Request, res: Response) => {

  const { name, location, capacity, manager } = req.body;

  const id = generateId();
  prepare('INSERT INTO warehouses (id, name, location, capacity, manager) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, location, capacity || '', manager || '');

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'create', 'warehouse', ?)`)
    .run(generateId(), req.user!.userId, id);

  res.status(201).json({ id, name, location, capacity, manager });
});

router.put('/warehouses/:id', authenticate, authorize('admin'), validate(updateWarehouseSchema), (req: Request, res: Response) => {

  const { id } = req.params;

  const existing = prepare('SELECT id FROM warehouses WHERE id = ?').get(id);
  if (!existing) throw new AppError(404, 'Warehouse not found');

  const fields: string[] = [];
  const values: any[] = [];
  const fieldMap: Record<string, string> = {
    name: 'name', location: 'location', capacity: 'capacity', manager: 'manager',
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

  prepare(`UPDATE warehouses SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: 'Warehouse updated successfully' });
});

router.delete('/warehouses/:id', authenticate, authorize('admin'), (req: Request, res: Response) => {

  const result = prepare('DELETE FROM warehouses WHERE id = ?').run(req.params.id);
  if (result.changes === 0) throw new AppError(404, 'Warehouse not found');
  res.json({ message: 'Warehouse deleted successfully' });
});

// === Notifications ===
router.get('/notifications', authenticate, (req: Request, res: Response) => {

  const prefs = prepare(`
    SELECT low_stock_email as lowStockEmail, low_stock_sms as lowStockSms,
           new_po_email as newPoEmail, new_po_sms as newPoSms,
           shipment_delayed_email as shipmentDelayedEmail, shipment_delayed_sms as shipmentDelayedSms,
           payment_due_email as paymentDueEmail, payment_due_sms as paymentDueSms
    FROM notification_preferences WHERE user_id = ?
  `).get(req.user!.userId) as any;

  if (!prefs) {
    res.json({
      lowStockEmail: true, lowStockSms: false,
      newPoEmail: true, newPoSms: true,
      shipmentDelayedEmail: true, shipmentDelayedSms: true,
      paymentDueEmail: true, paymentDueSms: false,
    });
    return;
  }

  res.json({
    lowStockEmail: !!prefs.lowStockEmail,
    lowStockSms: !!prefs.lowStockSms,
    newPoEmail: !!prefs.newPoEmail,
    newPoSms: !!prefs.newPoSms,
    shipmentDelayedEmail: !!prefs.shipmentDelayedEmail,
    shipmentDelayedSms: !!prefs.shipmentDelayedSms,
    paymentDueEmail: !!prefs.paymentDueEmail,
    paymentDueSms: !!prefs.paymentDueSms,
  });
});

router.put('/notifications', authenticate, validate(updateNotificationsSchema), (req: Request, res: Response) => {

  const userId = req.user!.userId;

  const existing = prepare('SELECT id FROM notification_preferences WHERE user_id = ?').get(userId);

  if (!existing) {
    prepare(`INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)`).run(generateId(), userId);
  }

  const fields: string[] = [];
  const values: any[] = [];
  const fieldMap: Record<string, string> = {
    lowStockEmail: 'low_stock_email', lowStockSms: 'low_stock_sms',
    newPoEmail: 'new_po_email', newPoSms: 'new_po_sms',
    shipmentDelayedEmail: 'shipment_delayed_email', shipmentDelayedSms: 'shipment_delayed_sms',
    paymentDueEmail: 'payment_due_email', paymentDueSms: 'payment_due_sms',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (req.body[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(req.body[key] ? 1 : 0);
    }
  }

  if (fields.length > 0) {
    fields.push('updated_at = datetime("now")');
    values.push(userId);
    prepare(`UPDATE notification_preferences SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
  }

  res.json({ message: 'Notification preferences updated' });
});

// === Permissions ===
router.get('/permissions', authenticate, authorize('admin'), (_req: Request, res: Response) => {

  const perms = prepare('SELECT role, feature, allowed FROM role_permissions ORDER BY feature, role').all() as any[];

  const features = [...new Set(perms.map(p => p.feature))];
  const result = features.map(feature => {
    const featurePerms: Record<string, boolean> = {};
    for (const p of perms.filter(pp => pp.feature === feature)) {
      featurePerms[p.role] = !!p.allowed;
    }
    return { feature, ...featurePerms };
  });

  res.json(result);
});

router.put('/permissions', authenticate, authorize('admin'), validate(updatePermissionsSchema), (req: Request, res: Response) => {

  const { permissions } = req.body;

  transaction(() => {
    for (const perm of permissions) {
      const existing = prepare('SELECT id FROM role_permissions WHERE role = ? AND feature = ?')
        .get(perm.role, perm.feature) as any;

      if (existing) {
        prepare('UPDATE role_permissions SET allowed = ? WHERE id = ?')
          .run(perm.allowed ? 1 : 0, existing.id);
      } else {
        prepare('INSERT INTO role_permissions (id, role, feature, allowed) VALUES (?, ?, ?, ?)')
          .run(generateId(), perm.role, perm.feature, perm.allowed ? 1 : 0);
      }
    }
  });

  prepare(`INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'update', 'permissions', 'all')`)
    .run(generateId(), req.user!.userId);

  res.json({ message: 'Permissions updated successfully' });
});

export default router;
