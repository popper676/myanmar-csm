import { Router, Request, Response } from 'express';
import { prepare } from '../db-wrapper';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticate, authorize('admin', 'manager'), (_req: Request, res: Response) => {


  const totalPurchases = prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_orders
    WHERE status NOT IN ('cancelled')
  `).get() as { total: number };

  const activeSuppliers = prepare('SELECT COUNT(*) as count FROM suppliers').get() as { count: number };

  const totalItems = prepare('SELECT COUNT(*) as count FROM inventory_items').get() as { count: number };
  const accurateItems = prepare(`
    SELECT COUNT(*) as count FROM inventory_items WHERE stock_status = 'sufficient'
  `).get() as { count: number };
  const accuracy = totalItems.count > 0
    ? ((accurateItems.count / totalItems.count) * 100).toFixed(1)
    : '0.0';

  res.json({
    totalPurchases: totalPurchases.total,
    activeSuppliers: activeSuppliers.count,
    inventoryAccuracy: parseFloat(accuracy),
  });
});

router.get('/turnover', authenticate, authorize('admin', 'manager'), (_req: Request, res: Response) => {
  res.json([
    { month: 'Aug', rate: 3.2 },
    { month: 'Sep', rate: 2.8 },
    { month: 'Oct', rate: 4.1 },
    { month: 'Nov', rate: 3.5 },
    { month: 'Dec', rate: 4.8 },
    { month: 'Jan', rate: 5.2 },
  ]);
});

router.get('/cost-breakdown', authenticate, authorize('admin', 'manager'), (_req: Request, res: Response) => {


  const breakdown = prepare(`
    SELECT category as name, COALESCE(SUM(quantity * unit_price), 0) as value
    FROM inventory_items
    GROUP BY category
    ORDER BY value DESC
  `).all() as any[];

  const total = breakdown.reduce((sum, b) => sum + b.value, 0);

  const result = breakdown.map(b => ({
    name: b.name,
    value: total > 0 ? parseFloat(((b.value / total) * 100).toFixed(1)) : 0,
  }));

  res.json(result);
});

router.get('/moving-products', authenticate, authorize('admin', 'manager'), (_req: Request, res: Response) => {


  const fastMoving = prepare(`
    SELECT name_en as name, quantity
    FROM inventory_items
    WHERE stock_status = 'sufficient' AND quantity > 500
    ORDER BY quantity DESC
    LIMIT 5
  `).all() as any[];

  const slowMoving = prepare(`
    SELECT name_en as name, quantity
    FROM inventory_items
    WHERE stock_status IN ('low', 'critical') OR quantity < 200
    ORDER BY quantity ASC
    LIMIT 5
  `).all() as any[];

  const result = [
    ...fastMoving.map(p => ({ name: p.name, fast: p.quantity, slow: 0 })),
    ...slowMoving.map(p => ({ name: p.name, fast: 0, slow: p.quantity })),
  ];

  res.json(result);
});

router.get('/inventory-valuation', authenticate, authorize('admin', 'manager'), (_req: Request, res: Response) => {


  const items = prepare(`
    SELECT name_en as name, category, quantity, unit_price as unitPrice,
           (quantity * unit_price) as totalValue, warehouse_name as warehouse, stock_status as stockStatus
    FROM inventory_items
    ORDER BY totalValue DESC
  `).all();

  const total = prepare('SELECT COALESCE(SUM(quantity * unit_price), 0) as total FROM inventory_items').get() as { total: number };

  res.json({ items, totalValue: total.total });
});

router.get('/supplier-performance', authenticate, authorize('admin', 'manager'), (_req: Request, res: Response) => {


  const suppliers = prepare(`
    SELECT name_en as name, category, rating, total_orders as totalOrders,
           on_time_delivery as onTimeDelivery, avg_lead_time as avgLeadTime, region
    FROM suppliers
    ORDER BY rating DESC
  `).all();

  res.json(suppliers);
});

router.get('/purchase-order-summary', authenticate, authorize('admin', 'manager'), (_req: Request, res: Response) => {


  const statusSummary = prepare(`
    SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as totalAmount
    FROM purchase_orders
    GROUP BY status
  `).all();

  const monthlySummary = prepare(`
    SELECT substr(order_date, 1, 7) as month,
           COUNT(*) as count,
           COALESCE(SUM(total_amount), 0) as totalAmount
    FROM purchase_orders
    GROUP BY substr(order_date, 1, 7)
    ORDER BY month DESC
    LIMIT 12
  `).all();

  res.json({ statusSummary, monthlySummary });
});

router.get('/stock-movement', authenticate, authorize('admin', 'manager'), (_req: Request, res: Response) => {


  const items = prepare(`
    SELECT name_en as name, category, quantity, min_stock as minStock,
           stock_status as stockStatus, warehouse_name as warehouse, last_updated as lastUpdated
    FROM inventory_items
    ORDER BY last_updated DESC
  `).all();

  res.json(items);
});

export default router;
