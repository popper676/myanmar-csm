import { Router, Request, Response } from 'express';
import { prepare } from '../db-wrapper';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (_req: Request, res: Response) => {


  const totalInventoryValue = prepare(`
    SELECT COALESCE(SUM(quantity * unit_price), 0) as total FROM inventory_items
  `).get() as { total: number };

  const pendingOrders = prepare(`
    SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'pending'
  `).get() as { count: number };

  const shipmentsInTransit = prepare(`
    SELECT COUNT(*) as count FROM shipments WHERE status IN ('dispatched', 'in_transit')
  `).get() as { count: number };

  const lowStockCount = prepare(`
    SELECT COUNT(*) as count FROM inventory_items WHERE stock_status IN ('low', 'critical')
  `).get() as { count: number };

  const lowStockItems = prepare(`
    SELECT id, sku, name_en as nameEn, name_mm as nameMm, category, quantity, unit,
           min_stock as minStock, warehouse_name as warehouse, stock_status as stockStatus
    FROM inventory_items
    WHERE stock_status IN ('low', 'critical')
    ORDER BY CASE stock_status WHEN 'critical' THEN 0 ELSE 1 END, quantity ASC
  `).all();

  const recentOrders = prepare(`
    SELECT id, po_number as poNumber, supplier_name as supplier, order_date as orderDate,
           total_amount as totalAmount, status
    FROM purchase_orders
    ORDER BY order_date DESC
    LIMIT 5
  `).all();

  const monthlySalesData = [
    { month: 'Aug', monthMm: 'သြ', sales: 42000000 },
    { month: 'Sep', monthMm: 'စက်', sales: 38000000 },
    { month: 'Oct', monthMm: 'အောက်', sales: 51000000 },
    { month: 'Nov', monthMm: 'နို', sales: 47000000 },
    { month: 'Dec', monthMm: 'ဒီ', sales: 55000000 },
    { month: 'Jan', monthMm: 'ဇန်', sales: 61000000 },
  ];

  const topProducts = prepare(`
    SELECT name_en as name, name_mm as nameMm, quantity
    FROM inventory_items
    ORDER BY quantity DESC
    LIMIT 5
  `).all();

  res.json({
    kpis: {
      totalInventoryValue: totalInventoryValue.total,
      pendingOrders: pendingOrders.count,
      shipmentsInTransit: shipmentsInTransit.count,
      lowStockAlerts: lowStockCount.count,
    },
    monthlySalesData,
    topProducts,
    recentOrders,
    lowStockItems,
  });
});

export default router;
