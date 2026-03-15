import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronRight, Check, Search, Loader2 } from "lucide-react";
import { purchaseOrderApi, supplierApi } from "@/lib/api";
import type { OrderStatus } from "@/data/dummy-data";

const formatMMK = (amount: number): string => `${amount.toLocaleString()} ကျပ်`;

const tabs = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "received", label: "Received" },
  { key: "cancelled", label: "Cancelled" },
];

const statusColors: Record<string, string> = {
  pending: "status-badge-pending",
  confirmed: "status-badge-confirmed",
  delivered: "status-badge-delivered",
  cancelled: "status-badge-cancelled",
  approved: "status-badge-confirmed",
  received: "status-badge-delivered",
};

export default function PurchaseOrders() {
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (tab: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tab !== "all") params.status = tab;
      const data = await purchaseOrderApi.list(params);
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const data = await purchaseOrderApi.list();
      setAllOrders(data);
    } catch (err) {
      console.error("Failed to fetch all orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
    fetchAllOrders();
  }, []);

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  useEffect(() => {
    supplierApi.list().then(setSuppliersList).catch(console.error);
  }, []);

  const handleStatusChange = async (e: React.MouseEvent, orderId: string, status: string) => {
    e.stopPropagation();
    try {
      await purchaseOrderApi.updateStatus(orderId, status);
      fetchOrders(activeTab);
      fetchAllOrders();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleCreateOrder = async () => {
    try {
      await purchaseOrderApi.create({});
      setShowCreate(false);
      fetchOrders(activeTab);
      fetchAllOrders();
    } catch (err) {
      console.error("Failed to create order:", err);
    }
  };

  const detailOrder = selectedOrder ? orders.find((o: any) => o.id === selectedOrder) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground font-myanmar">မှာယူမှု စီမံခန့်ခွဲမှု</p>
        </div>
        <button onClick={() => { setShowCreate(true); setStep(1); }} className="gold-button flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Create Purchase Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? "bg-card shadow-sm" : "hover:bg-card/50"}`}>
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({allOrders.filter((o: any) => o.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3 text-left font-medium text-muted-foreground">PO Number</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Supplier</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Order Date</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Expected Delivery</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Total (MMK)</th>
                <th className="p-3 text-center font-medium text-muted-foreground">Items</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                  <p className="font-myanmar">မှာယူမှု မရှိသေးပါ</p>
                  <p className="text-xs mt-1">No orders found</p>
                </td></tr>
              ) : orders.map((order: any) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order.id)}>
                  <td className="p-3 font-mono-data text-xs">{order.poNumber}</td>
                  <td className="p-3">{order.supplier}</td>
                  <td className="p-3 text-muted-foreground">{order.orderDate}</td>
                  <td className="p-3 text-muted-foreground">{order.expectedDelivery}</td>
                  <td className="p-3 text-right font-mono-data">{formatMMK(order.totalAmount)}</td>
                  <td className="p-3 text-center">{order.itemsCount}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>{order.status}</span>
                  </td>
                  <td className="p-3">
                    {(order.status === 'pending') && (
                      <div className="flex gap-1">
                        <button className="px-2 py-1 text-xs rounded bg-success/20 text-success hover:bg-success/30" onClick={(e) => handleStatusChange(e, order.id, 'approved')}>Approve</button>
                        <button className="px-2 py-1 text-xs rounded bg-destructive/20 text-destructive hover:bg-destructive/30" onClick={(e) => handleStatusChange(e, order.id, 'cancelled')}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Order Detail Drawer */}
      <AnimatePresence>
        {detailOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-foreground/50" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-lg bg-primary text-primary-foreground h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">{detailOrder.poNumber}</h2>
                  <button onClick={() => setSelectedOrder(null)} className="p-1 rounded hover:bg-sidebar-accent"><X className="w-5 h-5" /></button>
                </div>

                {/* Status Timeline */}
                <div className="flex items-center gap-2 mb-8">
                  {["pending", "approved", "received", "delivered"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        ["pending", "approved", "confirmed", "received", "delivered"].indexOf(detailOrder.status) >= i
                          ? "bg-accent text-accent-foreground"
                          : "bg-sidebar-accent text-sidebar-foreground/50"
                      }`}>
                        {["pending", "approved", "confirmed", "received", "delivered"].indexOf(detailOrder.status) >= i ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                      {i < 3 && <div className={`w-8 h-0.5 ${["pending", "approved", "confirmed", "received", "delivered"].indexOf(detailOrder.status) > i ? "bg-accent" : "bg-sidebar-accent"}`} />}
                    </div>
                  ))}
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between"><span className="opacity-70">Supplier</span><span>{detailOrder.supplier}</span></div>
                  <div className="flex justify-between"><span className="opacity-70">Order Date</span><span>{detailOrder.orderDate}</span></div>
                  <div className="flex justify-between"><span className="opacity-70">Expected Delivery</span><span>{detailOrder.expectedDelivery}</span></div>
                  <div className="flex justify-between"><span className="opacity-70">Items</span><span>{detailOrder.itemsCount} items</span></div>
                </div>

                <div className="mt-8 p-4 rounded-lg bg-sidebar-accent">
                  <p className="text-xs opacity-70 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-accent font-mono-data">{formatMMK(detailOrder.totalAmount)}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create PO Drawer */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-foreground/50" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-lg bg-primary text-primary-foreground h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">Create Purchase Order</h2>
                    <p className="text-xs opacity-70 font-myanmar">မှာယူလွှာအသစ်ဖန်တီးရန်</p>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-sidebar-accent"><X className="w-5 h-5" /></button>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-8">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "bg-accent text-accent-foreground" : "bg-sidebar-accent"}`}>{s}</div>
                      {s < 4 && <div className={`w-6 h-0.5 ${step > s ? "bg-accent" : "bg-sidebar-accent"}`} />}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {step === 1 && (
                    <div>
                      <h3 className="font-semibold mb-4">Select Supplier</h3>
                      <select className="w-full px-3 py-2 rounded-md bg-sidebar-accent text-sidebar-foreground border-0 text-sm">
                        <option>Choose supplier...</option>
                        {suppliersList.map((s: any) => <option key={s.id}>{s.nameEn} ({s.nameMm})</option>)}
                      </select>
                    </div>
                  )}
                  {step === 2 && (
                    <div>
                      <h3 className="font-semibold mb-4">Add Items</h3>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                        <input className="w-full pl-10 pr-4 py-2 rounded-md bg-sidebar-accent text-sidebar-foreground border-0 text-sm" placeholder="Search products..." />
                      </div>
                      <div className="space-y-2">
                        {suppliersList.slice(0, 5).map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-md bg-sidebar-accent">
                            <span className="text-sm">{item.nameEn}</span>
                            <div className="flex items-center gap-2">
                              <input type="number" className="w-16 px-2 py-1 rounded bg-primary text-primary-foreground text-sm text-center" placeholder="Qty" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold mb-4">Delivery Details</h3>
                      <div>
                        <label className="text-sm opacity-70">Warehouse</label>
                        <select className="w-full mt-1 px-3 py-2 rounded-md bg-sidebar-accent text-sidebar-foreground border-0 text-sm">
                          <option>Yangon Main</option><option>Mandalay Hub</option><option>Bago Depot</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm opacity-70">Expected Date</label>
                        <input type="date" className="w-full mt-1 px-3 py-2 rounded-md bg-sidebar-accent text-sidebar-foreground border-0 text-sm" />
                      </div>
                      <div>
                        <label className="text-sm opacity-70">Notes</label>
                        <textarea className="w-full mt-1 px-3 py-2 rounded-md bg-sidebar-accent text-sidebar-foreground border-0 text-sm" rows={3} />
                      </div>
                    </div>
                  )}
                  {step === 4 && (
                    <div>
                      <h3 className="font-semibold mb-4">Review & Submit</h3>
                      <div className="space-y-3 text-sm">
                        <div className="p-3 rounded-md bg-sidebar-accent"><span className="opacity-70">Supplier:</span> Myanmar Rice Corp</div>
                        <div className="p-3 rounded-md bg-sidebar-accent"><span className="opacity-70">Items:</span> 3 products</div>
                        <div className="p-3 rounded-md bg-sidebar-accent"><span className="opacity-70">Warehouse:</span> Yangon Main</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-8 p-4 rounded-lg bg-sidebar-accent">
                  <p className="text-xs opacity-70 mb-1">Estimated Total</p>
                  <p className="text-2xl font-bold text-accent font-mono-data">{formatMMK(12500000)}</p>
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-4 py-2 rounded-md bg-sidebar-accent text-sm disabled:opacity-40">Back</button>
                  {step < 4 ? (
                    <button onClick={() => setStep(step + 1)} className="gold-button flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={handleCreateOrder} className="gold-button">Submit Order</button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
