// Comprehensive dummy data for Myanmar SCM

export const formatMMK = (amount: number): string => {
  return `${amount.toLocaleString()} ကျပ်`;
};

export const formatMMKShort = (amount: number): string => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M ကျပ်`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K ကျပ်`;
  return `${amount} ကျပ်`;
};

export type StockStatus = 'sufficient' | 'low' | 'critical';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'approved' | 'received';
export type ShipmentStatus = 'ordered' | 'dispatched' | 'in_transit' | 'customs' | 'delivered';

export interface InventoryItem {
  id: string;
  sku: string;
  nameEn: string;
  nameMm: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  warehouse: string;
  lastUpdated: string;
  unitPrice: number;
  supplier: string;
  stockStatus: StockStatus;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  totalAmount: number;
  itemsCount: number;
  status: OrderStatus;
  items: { name: string; qty: number; unitPrice: number; total: number }[];
}

export interface Shipment {
  id: string;
  shipmentId: string;
  from: { en: string; mm: string };
  to: { en: string; mm: string };
  carrier: string;
  dispatchDate: string;
  eta: string;
  status: ShipmentStatus;
  trackingNumber: string;
  daysRemaining: number;
  items: string[];
}

export interface Supplier {
  id: string;
  nameEn: string;
  nameMm: string;
  location: string;
  township: string;
  city: string;
  category: string;
  rating: number;
  totalOrders: number;
  phone: string;
  email: string;
  onTimeDelivery: number;
  avgLeadTime: number;
  region: 'upper' | 'lower';
}

export const inventoryItems: InventoryItem[] = [
  { id: '1', sku: 'RICE-001', nameEn: 'Jasmine Rice', nameMm: 'ဆန် (ပေါင်းမ)', category: 'Food', quantity: 5000, unit: 'kg', minStock: 1000, warehouse: 'Yangon Main', lastUpdated: '2024-01-15', unitPrice: 2500, supplier: 'Myanmar Rice Corp', stockStatus: 'sufficient' },
  { id: '2', sku: 'OIL-001', nameEn: 'Cooking Oil', nameMm: 'ဆီ', category: 'Food', quantity: 200, unit: 'liter', minStock: 500, warehouse: 'Yangon Main', lastUpdated: '2024-01-14', unitPrice: 5000, supplier: 'Shwe Oil Trading', stockStatus: 'critical' },
  { id: '3', sku: 'LGY-001', nameEn: 'Longyi (Men)', nameMm: 'လုံချည် (ယောက်ျားသုံး)', category: 'Textile', quantity: 350, unit: 'pcs', minStock: 100, warehouse: 'Mandalay Hub', lastUpdated: '2024-01-13', unitPrice: 15000, supplier: 'Amarapura Textiles', stockStatus: 'sufficient' },
  { id: '4', sku: 'THK-001', nameEn: 'Thanaka', nameMm: 'သနပ်ခါး', category: 'Cosmetics', quantity: 80, unit: 'kg', minStock: 100, warehouse: 'Mandalay Hub', lastUpdated: '2024-01-12', unitPrice: 8000, supplier: 'Shwebo Thanaka Co', stockStatus: 'low' },
  { id: '5', sku: 'TEA-001', nameEn: 'Green Tea Leaves', nameMm: 'လက်ဖက်ခြောက်', category: 'Food', quantity: 1500, unit: 'kg', minStock: 300, warehouse: 'Yangon Main', lastUpdated: '2024-01-11', unitPrice: 12000, supplier: 'Shan Tea Garden', stockStatus: 'sufficient' },
  { id: '6', sku: 'NUT-001', nameEn: 'Betel Nut', nameMm: 'ကွမ်းသီး', category: 'Food', quantity: 45, unit: 'kg', minStock: 200, warehouse: 'Bago Depot', lastUpdated: '2024-01-10', unitPrice: 6000, supplier: 'Bago Betel Trading', stockStatus: 'critical' },
  { id: '7', sku: 'CHR-001', nameEn: 'Cheroot Cigars', nameMm: 'ဆေးလိပ်', category: 'Tobacco', quantity: 2000, unit: 'pcs', minStock: 500, warehouse: 'Bago Depot', lastUpdated: '2024-01-09', unitPrice: 500, supplier: 'Bago Cheroot Mfg', stockStatus: 'sufficient' },
  { id: '8', sku: 'FIS-001', nameEn: 'Dried Fish', nameMm: 'ငါးခြောက်', category: 'Food', quantity: 150, unit: 'kg', minStock: 200, warehouse: 'Yangon Main', lastUpdated: '2024-01-08', unitPrice: 18000, supplier: 'Delta Fisheries', stockStatus: 'low' },
  { id: '9', sku: 'SPN-001', nameEn: 'Shrimp Paste', nameMm: 'ငါးပိ', category: 'Food', quantity: 800, unit: 'kg', minStock: 200, warehouse: 'Yangon Main', lastUpdated: '2024-01-07', unitPrice: 7000, supplier: 'Delta Fisheries', stockStatus: 'sufficient' },
  { id: '10', sku: 'TRM-001', nameEn: 'Turmeric Powder', nameMm: 'နန်နံဖြူမှုန့်', category: 'Spices', quantity: 300, unit: 'kg', minStock: 100, warehouse: 'Mandalay Hub', lastUpdated: '2024-01-06', unitPrice: 9000, supplier: 'Meiktila Spice Co', stockStatus: 'sufficient' },
  { id: '11', sku: 'JGY-001', nameEn: 'Jaggery (Palm Sugar)', nameMm: 'ထန်းလျက်', category: 'Food', quantity: 90, unit: 'kg', minStock: 150, warehouse: 'Bago Depot', lastUpdated: '2024-01-05', unitPrice: 4000, supplier: 'Ayeyarwady Palm Co', stockStatus: 'low' },
  { id: '12', sku: 'LAC-001', nameEn: 'Lacquerware Bowl', nameMm: 'ယွန်းထည်', category: 'Handicraft', quantity: 60, unit: 'pcs', minStock: 20, warehouse: 'Mandalay Hub', lastUpdated: '2024-01-04', unitPrice: 35000, supplier: 'Bagan Lacquer Works', stockStatus: 'sufficient' },
  { id: '13', sku: 'SLK-001', nameEn: 'Silk Fabric', nameMm: 'ပိုးထည်', category: 'Textile', quantity: 25, unit: 'meter', minStock: 50, warehouse: 'Mandalay Hub', lastUpdated: '2024-01-03', unitPrice: 45000, supplier: 'Amarapura Textiles', stockStatus: 'critical' },
  { id: '14', sku: 'RBR-001', nameEn: 'Natural Rubber', nameMm: 'ရာဘာ', category: 'Raw Material', quantity: 2000, unit: 'kg', minStock: 500, warehouse: 'Mawlamyine Store', lastUpdated: '2024-01-02', unitPrice: 3500, supplier: 'Mon Rubber Co', stockStatus: 'sufficient' },
  { id: '15', sku: 'TKW-001', nameEn: 'Teak Wood Planks', nameMm: 'ကျွန်းသစ်ခုံ', category: 'Raw Material', quantity: 120, unit: 'pcs', minStock: 50, warehouse: 'Mandalay Hub', lastUpdated: '2024-01-01', unitPrice: 120000, supplier: 'Sagaing Timber Co', stockStatus: 'sufficient' },
  { id: '16', sku: 'CHL-001', nameEn: 'Chili Flakes', nameMm: 'ငရုတ်သီးအကြွပ်', category: 'Spices', quantity: 400, unit: 'kg', minStock: 100, warehouse: 'Yangon Main', lastUpdated: '2024-01-15', unitPrice: 11000, supplier: 'Meiktila Spice Co', stockStatus: 'sufficient' },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: '1', poNumber: 'PO-2024-001', supplier: 'Myanmar Rice Corp', orderDate: '2024-01-15', expectedDelivery: '2024-01-25', totalAmount: 12500000, itemsCount: 3, status: 'pending', items: [{ name: 'Jasmine Rice', qty: 5000, unitPrice: 2500, total: 12500000 }] },
  { id: '2', poNumber: 'PO-2024-002', supplier: 'Shwe Yadanar Trading', orderDate: '2024-01-14', expectedDelivery: '2024-01-22', totalAmount: 8750000, itemsCount: 5, status: 'confirmed', items: [] },
  { id: '3', poNumber: 'PO-2024-003', supplier: 'KBZ Wholesale', orderDate: '2024-01-12', expectedDelivery: '2024-01-20', totalAmount: 3200000, itemsCount: 2, status: 'delivered', items: [] },
  { id: '4', poNumber: 'PO-2024-004', supplier: 'Amarapura Textiles', orderDate: '2024-01-10', expectedDelivery: '2024-01-28', totalAmount: 6800000, itemsCount: 4, status: 'approved', items: [] },
  { id: '5', poNumber: 'PO-2024-005', supplier: 'Shan Tea Garden', orderDate: '2024-01-08', expectedDelivery: '2024-01-18', totalAmount: 4500000, itemsCount: 2, status: 'received', items: [] },
  { id: '6', poNumber: 'PO-2024-006', supplier: 'Delta Fisheries', orderDate: '2024-01-06', expectedDelivery: '2024-01-16', totalAmount: 2100000, itemsCount: 3, status: 'cancelled', items: [] },
  { id: '7', poNumber: 'PO-2024-007', supplier: 'Bagan Lacquer Works', orderDate: '2024-01-05', expectedDelivery: '2024-02-01', totalAmount: 5600000, itemsCount: 6, status: 'pending', items: [] },
  { id: '8', poNumber: 'PO-2024-008', supplier: 'Mon Rubber Co', orderDate: '2024-01-04', expectedDelivery: '2024-01-24', totalAmount: 7000000, itemsCount: 1, status: 'confirmed', items: [] },
  { id: '9', poNumber: 'PO-2024-009', supplier: 'Sagaing Timber Co', orderDate: '2024-01-03', expectedDelivery: '2024-01-30', totalAmount: 14400000, itemsCount: 2, status: 'approved', items: [] },
  { id: '10', poNumber: 'PO-2024-010', supplier: 'Meiktila Spice Co', orderDate: '2024-01-02', expectedDelivery: '2024-01-12', totalAmount: 1800000, itemsCount: 4, status: 'delivered', items: [] },
  { id: '11', poNumber: 'PO-2024-011', supplier: 'Shwe Oil Trading', orderDate: '2024-01-01', expectedDelivery: '2024-01-15', totalAmount: 9200000, itemsCount: 2, status: 'pending', items: [] },
];

export const shipments: Shipment[] = [
  { id: '1', shipmentId: 'SHP-001', from: { en: 'Yangon', mm: 'ရန်ကုန်' }, to: { en: 'Mandalay', mm: 'မန္တလေး' }, carrier: 'Myanmar Express Logistics', dispatchDate: '2024-01-14', eta: '2024-01-17', status: 'in_transit', trackingNumber: 'MEL-20240114-001', daysRemaining: 2, items: ['Jasmine Rice x5000kg'] },
  { id: '2', shipmentId: 'SHP-002', from: { en: 'Mandalay', mm: 'မန္တလေး' }, to: { en: 'Naypyidaw', mm: 'နေပြည်တော်' }, carrier: 'KBZ Express', dispatchDate: '2024-01-13', eta: '2024-01-15', status: 'customs', trackingNumber: 'KBZ-20240113-002', daysRemaining: 1, items: ['Longyi x350pcs'] },
  { id: '3', shipmentId: 'SHP-003', from: { en: 'Bago', mm: 'ပဲခူး' }, to: { en: 'Yangon', mm: 'ရန်ကုန်' }, carrier: 'Golden Truck Co', dispatchDate: '2024-01-12', eta: '2024-01-13', status: 'delivered', trackingNumber: 'GTC-20240112-003', daysRemaining: 0, items: ['Cheroot Cigars x2000pcs'] },
  { id: '4', shipmentId: 'SHP-004', from: { en: 'Mawlamyine', mm: 'မော်လမြိုင်' }, to: { en: 'Yangon', mm: 'ရန်ကုန်' }, carrier: 'Delta Shipping', dispatchDate: '2024-01-15', eta: '2024-01-20', status: 'dispatched', trackingNumber: 'DS-20240115-004', daysRemaining: 5, items: ['Natural Rubber x2000kg'] },
  { id: '5', shipmentId: 'SHP-005', from: { en: 'Taunggyi', mm: 'တောင်ကြီး' }, to: { en: 'Mandalay', mm: 'မန္တလေး' }, carrier: 'Shan Express', dispatchDate: '2024-01-10', eta: '2024-01-14', status: 'in_transit', trackingNumber: 'SE-20240110-005', daysRemaining: 0, items: ['Green Tea x1500kg'] },
  { id: '6', shipmentId: 'SHP-006', from: { en: 'Yangon', mm: 'ရန်ကုန်' }, to: { en: 'Bago', mm: 'ပဲခူး' }, carrier: 'Myanmar Express Logistics', dispatchDate: '2024-01-16', eta: '2024-01-18', status: 'ordered', trackingNumber: 'MEL-20240116-006', daysRemaining: 3, items: ['Cooking Oil x500L'] },
];

export const suppliers: Supplier[] = [
  { id: '1', nameEn: 'Myanmar Rice Corp', nameMm: 'မြန်မာဆန်ကုမ္ပဏီ', location: 'Insein', township: 'Insein', city: 'Yangon', category: 'Food', rating: 4.5, totalOrders: 45, phone: '+95-9-123456789', email: 'contact@myanmarrice.mm', onTimeDelivery: 92, avgLeadTime: 5, region: 'lower' },
  { id: '2', nameEn: 'Shwe Yadanar Trading', nameMm: 'ရွှေရတနာကုန်သည်', location: 'Bayintnaung', township: 'Mayangone', city: 'Yangon', category: 'General', rating: 4.2, totalOrders: 38, phone: '+95-9-987654321', email: 'info@shweyadanar.mm', onTimeDelivery: 88, avgLeadTime: 7, region: 'lower' },
  { id: '3', nameEn: 'KBZ Wholesale', nameMm: 'ကမ္ဘောဇလက်ကား', location: 'Chanmyathazi', township: 'Chanmyathazi', city: 'Mandalay', category: 'General', rating: 4.7, totalOrders: 62, phone: '+95-9-111222333', email: 'wholesale@kbz.mm', onTimeDelivery: 95, avgLeadTime: 4, region: 'upper' },
  { id: '4', nameEn: 'Amarapura Textiles', nameMm: 'အမရပူရပိုးထည်', location: 'Amarapura', township: 'Amarapura', city: 'Mandalay', category: 'Textile', rating: 4.8, totalOrders: 28, phone: '+95-9-444555666', email: 'sales@amarapura-tex.mm', onTimeDelivery: 97, avgLeadTime: 10, region: 'upper' },
  { id: '5', nameEn: 'Shan Tea Garden', nameMm: 'ရှမ်းလက်ဖက်ခြံ', location: 'Namhsan', township: 'Namhsan', city: 'Taunggyi', category: 'Food', rating: 4.3, totalOrders: 22, phone: '+95-9-777888999', email: 'info@shantea.mm', onTimeDelivery: 85, avgLeadTime: 8, region: 'upper' },
  { id: '6', nameEn: 'Delta Fisheries', nameMm: 'ဒေးလ်တာငါးလုပ်ငန်း', location: 'Myaungmya', township: 'Myaungmya', city: 'Pathein', category: 'Food', rating: 3.9, totalOrders: 31, phone: '+95-9-222333444', email: 'sales@deltafisheries.mm', onTimeDelivery: 78, avgLeadTime: 6, region: 'lower' },
  { id: '7', nameEn: 'Bagan Lacquer Works', nameMm: 'ပုဂံယွန်းထည်', location: 'Myinkaba', township: 'Nyaung-U', city: 'Bagan', category: 'Handicraft', rating: 4.9, totalOrders: 15, phone: '+95-9-555666777', email: 'order@baganlacquer.mm', onTimeDelivery: 90, avgLeadTime: 14, region: 'upper' },
  { id: '8', nameEn: 'Mon Rubber Co', nameMm: 'မွန်ရာဘာကုမ္ပဏီ', location: 'Mawlamyine', township: 'Mawlamyine', city: 'Mawlamyine', category: 'Raw Material', rating: 4.1, totalOrders: 19, phone: '+95-9-888999000', email: 'info@monrubber.mm', onTimeDelivery: 82, avgLeadTime: 9, region: 'lower' },
  { id: '9', nameEn: 'Sagaing Timber Co', nameMm: 'စစ်ကိုင်းသစ်ကုမ္ပဏီ', location: 'Sagaing', township: 'Sagaing', city: 'Sagaing', category: 'Raw Material', rating: 4.0, totalOrders: 12, phone: '+95-9-333444555', email: 'sales@sagaingtimber.mm', onTimeDelivery: 80, avgLeadTime: 12, region: 'upper' },
  { id: '10', nameEn: 'Meiktila Spice Co', nameMm: 'မိတ္ထီလာအမွှေးအကြိုင်', location: 'Meiktila', township: 'Meiktila', city: 'Meiktila', category: 'Spices', rating: 4.4, totalOrders: 27, phone: '+95-9-666777888', email: 'info@meiktilaspice.mm', onTimeDelivery: 91, avgLeadTime: 6, region: 'upper' },
  { id: '11', nameEn: 'Shwe Oil Trading', nameMm: 'ရွှေဆီကုန်သည်', location: 'Hlaingthaya', township: 'Hlaingthaya', city: 'Yangon', category: 'Food', rating: 3.8, totalOrders: 41, phone: '+95-9-999000111', email: 'contact@shweoil.mm', onTimeDelivery: 75, avgLeadTime: 5, region: 'lower' },
  { id: '12', nameEn: 'Ayeyarwady Palm Co', nameMm: 'ဧရာဝတီထန်းကုမ္ပဏီ', location: 'Pathein', township: 'Pathein', city: 'Pathein', category: 'Food', rating: 4.0, totalOrders: 18, phone: '+95-9-112233445', email: 'info@ayepalm.mm', onTimeDelivery: 83, avgLeadTime: 7, region: 'lower' },
  { id: '13', nameEn: 'Shwebo Thanaka Co', nameMm: 'ရွှေဘိုသနပ်ခါး', location: 'Shwebo', township: 'Shwebo', city: 'Shwebo', category: 'Cosmetics', rating: 4.6, totalOrders: 33, phone: '+95-9-556677889', email: 'sales@shwebothanaka.mm', onTimeDelivery: 93, avgLeadTime: 8, region: 'upper' },
  { id: '14', nameEn: 'Bago Cheroot Mfg', nameMm: 'ပဲခူးဆေးလိပ်', location: 'Bago', township: 'Bago', city: 'Bago', category: 'Tobacco', rating: 3.7, totalOrders: 20, phone: '+95-9-998877665', email: 'info@bagocheroot.mm', onTimeDelivery: 79, avgLeadTime: 5, region: 'lower' },
];

export const monthlySalesData = [
  { month: 'Aug', monthMm: 'သြ', sales: 42000000 },
  { month: 'Sep', monthMm: 'စက်', sales: 38000000 },
  { month: 'Oct', monthMm: 'အောက်', sales: 51000000 },
  { month: 'Nov', monthMm: 'နို', sales: 47000000 },
  { month: 'Dec', monthMm: 'ဒီ', sales: 55000000 },
  { month: 'Jan', monthMm: 'ဇန်', sales: 61000000 },
];

export const topProductsData = [
  { name: 'Jasmine Rice', nameMm: 'ဆန်', quantity: 5000 },
  { name: 'Cheroot Cigars', nameMm: 'ဆေးလိပ်', quantity: 2000 },
  { name: 'Green Tea', nameMm: 'လက်ဖက်ခြောက်', quantity: 1500 },
  { name: 'Shrimp Paste', nameMm: 'ငါးပိ', quantity: 800 },
  { name: 'Chili Flakes', nameMm: 'ငရုတ်သီး', quantity: 400 },
];

export const recentOrders = purchaseOrders.slice(0, 5);

export const lowStockItems = inventoryItems.filter(i => i.stockStatus === 'critical' || i.stockStatus === 'low');

export const categories = ['Food', 'Textile', 'Cosmetics', 'Tobacco', 'Spices', 'Handicraft', 'Raw Material'];
export const warehouses = ['Yangon Main', 'Mandalay Hub', 'Bago Depot', 'Mawlamyine Store'];
export const units = ['kg', 'liter', 'pcs', 'meter'];

export const myanmarCities = [
  { en: 'Yangon', mm: 'ရန်ကုန်', x: 50, y: 80 },
  { en: 'Bago', mm: 'ပဲခူး', x: 55, y: 70 },
  { en: 'Naypyidaw', mm: 'နေပြည်တော်', x: 50, y: 50 },
  { en: 'Mandalay', mm: 'မန္တလေး', x: 52, y: 30 },
  { en: 'Mawlamyine', mm: 'မော်လမြိုင်', x: 65, y: 75 },
  { en: 'Taunggyi', mm: 'တောင်ကြီး', x: 70, y: 45 },
];
