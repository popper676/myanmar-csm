import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronRight, Check, Loader2, Pencil, Trash2 } from "lucide-react";
import { purchaseOrderApi, supplierApi } from "@/lib/api";

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

const emptyOrder = {
  supplierName: '', orderDate: new Date().toISOString().split('T')[0],
  expectedDelivery: '', warehouse: 'Yangon Main', notes: '',
  items: [{ name: '', qty: 1, unitPrice: 0 }] as { name: string; qty: number; unitPrice: number }[],
};

export default function PurchaseOrders() {
  const routeLocation = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (routeLocation.state?.openCreate === 'create-order') {
      openCreateDrawer();
      window.history.replaceState({}, '');
    }
  }, [routeLocation.state]);

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
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const data = await purchaseOrderApi.list();
      setAllOrders(Array.isArray(data) ? data : data.orders || []);
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
    supplierApi.list().then((data: any) => {
      setSuppliersList(Array.isArray(data) ? data : data.suppliers || []);
    }).catch(console.error);
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

  const [formData, setFormData] = useState(emptyOrder);

  const openCreateDrawer = () => {
    setEditingId(null);
    setFormData(emptyOrder);
    setStep(1);
    setShowCreate(true);
  };

  const openEditDrawer = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      const detail = await purchaseOrderApi.get(orderId);
      setEditingId(orderId);
      setFormData({
        supplierName: detail.supplier || '',
        orderDate: detail.orderDate || new Date().toISOString().split('T')[0],
        expectedDelivery: detail.expectedDelivery || '',
        warehouse: detail.warehouse || 'Yangon Main',
        notes: detail.notes || '',
        items: (detail.items && detail.items.length > 0)
          ? detail.items.map((i: any) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice }))
          : [{ name: '', qty: 1, unitPrice: 0 }],
      });
      setStep(1);
      setShowCreate(true);
    } catch (err) {
      console.error("Failed to load order for edit:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await purchaseOrderApi.delete(id);
      setDeleteConfirm(null);
      fetchOrders(activeTab);
      fetchAllOrders();
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const handleSaveOrder = async () => {
    const validItems = formData.items.filter(i => i.name && i.qty > 0);
    if (!formData.supplierName || validItems.length === 0) {
      console.error("Please select a supplier and add at least one item");
      return;
    }
    const payload = {
      supplierName: formData.supplierName,
      orderDate: formData.orderDate,
      expectedDelivery: formData.expectedDelivery || undefined,
      warehouse: formData.warehouse,
      notes: formData.notes || undefined,
      items: validItems,
    };
    try {
      if (editingId) {
        await purchaseOrderApi.update(editingId, payload);
      } else {
        await purchaseOrderApi.create(payload);
      }
      setShowCreate(false);
      setFormData(emptyOrder);
      setEditingId(null);
      setStep(1);
      fetchOrders(activeTab);
      fetchAllOrders();
    } catch (err) {
      console.error("Failed to save order:", err);
    }
  };

  const detailOrder = selectedOrder ? orders.find((o: any) => o.id === selectedOrder) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Purchase Orders</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-myanmar">မှာယူမှု စီမံခန့်ခွဲမှု</p>
        </div>
        <button onClick={openCreateDrawer} className="gold-button flex items-center gap-2 self-start text-sm">
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
                <th className="p-3 text-left font-medium text-muted-foreground">Expected</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Total (MMK)</th>
                <th className="p-3 text-center font-medium text-muted-foreground">Items</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-center font-medium text-muted-foreground">Actions</th>
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
                    <div className="flex items-center justify-center gap-1">
                      {(order.status === 'pending') && (
                        <>
                          <button className="px-2 py-1 text-xs rounded bg-success/20 text-success hover:bg-success/30" onClick={(e) => handleStatusChange(e, order.id, 'approved')}>Approve</button>
                          <button className="px-2 py-1 text-xs rounded bg-destructive/20 text-destructive hover:bg-destructive/30" onClick={(e) => handleStatusChange(e, order.id, 'cancelled')}>Reject</button>
                        </>
                      )}
                      {['pending', 'approved'].includes(order.status) && (
                        <button onClick={(e) => openEditDrawer(e, order.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(order.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full sm:max-w-lg bg-primary text-primary-foreground h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-bold">{detailOrder.poNumber}</h2>
                  <div className="flex items-center gap-2">
                    {['pending', 'approved'].includes(detailOrder.status) && (
                      <button onClick={(e) => { setSelectedOrder(null); openEditDrawer(e, detailOrder.id); }} className="p-1.5 rounded hover:bg-sidebar-accent" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setSelectedOrder(null)} className="p-1 rounded hover:bg-sidebar-accent"><X className="w-5 h-5" /></button>
                  </div>
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

                <div className="mt-6 flex gap-3">
                  {['pending', 'approved'].includes(detailOrder.status) && (
                    <button onClick={(e) => { setSelectedOrder(null); openEditDrawer(e, detailOrder.id); }} className="flex-1 px-4 py-2 rounded-md bg-sidebar-accent text-sm font-medium hover:bg-sidebar-accent/80 flex items-center justify-center gap-2">
                      <Pencil className="w-4 h-4" /> Edit Order
                    </button>
                  )}
                  <button onClick={() => { setSelectedOrder(null); setDeleteConfirm(detailOrder.id); }} className="px-4 py-2 rounded-md bg-destructive/20 text-destructive-foreground text-sm font-medium hover:bg-destructive/30 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit PO Drawer */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-foreground/50" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full sm:max-w-lg bg-primary text-primary-foreground h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">{editingId ? "Edit Purchase Order" : "Create Purchase Order"}</h2>
                    <p className="text-xs opacity-70 font-myanmar">{editingId ? "မှာယူလွှာပြင်ဆင်ရန်" : "မှာယူလွှာအသစ်ဖန်တီးရန်"}</p>
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
                      <select value={formData.supplierName} onChange={e => setFormData(o => ({ ...o, supplierName: e.target.value }))} className="w-full px-3 py-2 rounded-md bg-sidebar-accent text-sidebar-foreground border-0 text-sm">
                        <option value="">Choose supplier...</option>
                        {suppliersList.map((s: any) => <option key={s.id} value={s.nameEn}>{s.nameEn}{s.nameMm ? ` (${s.nameMm})` : ''}</option>)}
                      </select>
                    </div>
                  )}
                  {step === 2 && (
                    <div>
                      <h3 className="font-semibold mb-4">Add Items</h3>
                      <div className="space-y-3">
                        {formData.items.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-md bg-sidebar-accent space-y-2">
                            <div className="flex items-center gap-2">
                              <input value={item.name} onChange={e => { const items = [...formData.items]; items[idx].name = e.target.value; setFormData(o => ({ ...o, items })); }} placeholder="Item name" className="flex-1 px-2 py-1 rounded bg-primary text-primary-foreground text-sm" />
                              {formData.items.length > 1 && (
                                <button onClick={() => setFormData(o => ({ ...o, items: o.items.filter((_, i) => i !== idx) }))} className="p-1 rounded hover:bg-primary text-primary-foreground/50 hover:text-primary-foreground">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input type="number" value={item.qty || ''} onChange={e => { const items = [...formData.items]; items[idx].qty = parseInt(e.target.value) || 0; setFormData(o => ({ ...o, items })); }} placeholder="Qty" className="w-20 px-2 py-1 rounded bg-primary text-primary-foreground text-sm text-center" />
                              <input type="number" value={item.unitPrice || ''} onChange={e => { const items = [...formData.items]; items[idx].unitPrice = parseFloat(e.target.value) || 0; setFormData(o => ({ ...o, items })); }} placeholder="Unit Price" className="flex-1 px-2 py-1 rounded bg-primary text-primary-foreground text-sm" />
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setFormData(o => ({ ...o, items: [...o.items, { name: '', qty: 1, unitPrice: 0 }] }))} className="text-xs text-accent hover:underline">+ Add another item</button>
                      </div>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold mb-4">Delivery Details</h3>
                      <div>
                        <label className="text-sm opacity-70">Warehouse</label>
                        <select value={formData.warehouse} onChange={e => setFormData(o => ({ ...o, warehouse: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md bg-sidebar-accent text-sidebar-foreground border-0 text-sm">
                          <option>Yangon Main</option><option>Mandalay Hub</option><option>Bago Depot</option><option>Mawlamyine Store</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm opacity-70">Expected Delivery Date</label>
                        <input type="date" value={formData.expectedDelivery} onChange={e => setFormData(o => ({ ...o, expectedDelivery: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md bg-sidebar-accent text-sidebar-foreground border-0 text-sm" />
                      </div>
                      <div>
                        <label className="text-sm opacity-70">Notes</label>
                        <textarea value={formData.notes} onChange={e => setFormData(o => ({ ...o, notes: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md bg-sidebar-accent text-sidebar-foreground border-0 text-sm" rows={3} />
                      </div>
                    </div>
                  )}
                  {step === 4 && (
                    <div>
                      <h3 className="font-semibold mb-4">Review & Submit</h3>
                      <div className="space-y-3 text-sm">
                        <div className="p-3 rounded-md bg-sidebar-accent"><span className="opacity-70">Supplier:</span> {formData.supplierName || '—'}</div>
                        <div className="p-3 rounded-md bg-sidebar-accent"><span className="opacity-70">Items:</span> {formData.items.filter(i => i.name).length} products</div>
                        <div className="p-3 rounded-md bg-sidebar-accent"><span className="opacity-70">Warehouse:</span> {formData.warehouse}</div>
                        {formData.expectedDelivery && <div className="p-3 rounded-md bg-sidebar-accent"><span className="opacity-70">Expected:</span> {formData.expectedDelivery}</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-8 p-4 rounded-lg bg-sidebar-accent">
                  <p className="text-xs opacity-70 mb-1">Estimated Total</p>
                  <p className="text-2xl font-bold text-accent font-mono-data">{formatMMK(formData.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0))}</p>
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-4 py-2 rounded-md bg-sidebar-accent text-sm disabled:opacity-40">Back</button>
                  {step < 4 ? (
                    <button onClick={() => setStep(step + 1)} className="gold-button flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={handleSaveOrder} className="gold-button">{editingId ? "Update Order" : "Submit Order"}</button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-lg shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2">Delete Purchase Order</h3>
              <p className="text-sm text-muted-foreground mb-1">Are you sure you want to delete this order? This action cannot be undone.</p>
              <p className="text-xs font-myanmar text-muted-foreground mb-6">ဤမှာယူလွှာကို ဖျက်ရန် သေချာပါသလား?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
