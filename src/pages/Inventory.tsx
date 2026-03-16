import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ChevronLeft, ChevronRight, Trash2, Download, X, Loader2, Pencil } from "lucide-react";
import { inventoryApi } from "@/lib/api";
import { type StockStatus } from "@/data/dummy-data";

const formatMMK = (amount: number): string => `${amount.toLocaleString()} ကျပ်`;

const stockLabel: Record<StockStatus, { text: string; class: string }> = {
  sufficient: { text: "Sufficient", class: "stock-sufficient" },
  low: { text: "Low", class: "stock-low" },
  critical: { text: "Critical", class: "stock-critical" },
};

const emptyItem = { nameEn: '', sku: '', category: 'Food', unit: 'kg', quantity: 0, minStock: 0, warehouseName: 'Yangon Main', unitPrice: 0, supplierName: '' };

export default function Inventory() {
  const routeLocation = useLocation();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 8, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState(emptyItem);

  useEffect(() => {
    if (routeLocation.state?.openCreate === 'create-item') {
      openCreateModal();
      window.history.replaceState({}, '');
    }
  }, [routeLocation.state]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '8' };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (warehouseFilter) params.warehouse = warehouseFilter;
      const data = await inventoryApi.list(params);
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, categoryFilter, warehouseFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    Promise.all([inventoryApi.categories(), inventoryApi.warehouses(), inventoryApi.units()])
      .then(([cats, whs, us]) => { setCategories(cats); setWarehouses(whs); setUnits(us); });
  }, []);

  const toggleSelect = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === items.length ? [] : items.map((i) => i.id));

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyItem);
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setFormData({
      nameEn: item.nameEn || '', sku: item.sku || '', category: item.category || 'Food',
      unit: item.unit || 'kg', quantity: item.quantity || 0, minStock: item.minStock || 0,
      warehouseName: item.warehouse || 'Yangon Main', unitPrice: item.unitPrice || 0, supplierName: item.supplierName || '',
    });
    setShowModal(true);
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    try {
      await inventoryApi.bulkDelete(selected);
      setSelected([]);
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try {
      await inventoryApi.delete(id);
      setDeleteConfirm(null);
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const handleExport = async () => {
    try {
      const csv = await inventoryApi.exportCsv();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'inventory_export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    if (!formData.nameEn || !formData.sku) return;
    setSaving(true);
    try {
      if (editingId) {
        await inventoryApi.update(editingId, formData);
      } else {
        await inventoryApi.create(formData);
      }
      setShowModal(false);
      setFormData(emptyItem);
      setEditingId(null);
      fetchItems();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Inventory Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-myanmar">သိုလှောင်ရုံ စီမံခန့်ခွဲမှု</p>
        </div>
        <button onClick={openCreateModal} className="gold-button flex items-center gap-2 self-start text-sm">
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, SKU..." className="w-full pl-10 pr-4 py-2 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-md border bg-card text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-md border bg-card text-sm">
          <option value="">All Warehouses</option>
          {warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-md text-sm">
          <span>{selected.length} selected</span>
          <button onClick={handleBulkDelete} className="flex items-center gap-1 text-destructive hover:underline"><Trash2 className="w-3 h-3" /> Delete</button>
          <button onClick={handleExport} className="flex items-center gap-1 text-primary hover:underline"><Download className="w-3 h-3" /> Export</button>
        </div>
      )}

      <div className="card-elevated overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-3 w-10"><input type="checkbox" checked={selected.length === items.length && items.length > 0} onChange={toggleAll} className="rounded" /></th>
                  <th className="p-3 text-left font-medium text-muted-foreground">SKU</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Product Name</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Qty</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Unit</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Min Stock</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="p-3 text-center font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">
                    <p className="font-myanmar">ပစ္စည်း မရှိသေးပါ</p>
                    <p className="text-xs mt-1">No items found</p>
                  </td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" /></td>
                    <td className="p-3 font-mono-data text-xs">{item.sku}</td>
                    <td className="p-3">
                      <p className="font-medium">{item.nameEn}</p>
                      <p className="text-xs font-myanmar text-muted-foreground">{item.nameMm}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">{item.category}</td>
                    <td className="p-3 text-right font-mono-data">{item.quantity?.toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{item.unit}</td>
                    <td className="p-3 text-right font-mono-data text-muted-foreground">{item.minStock}</td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold ${stockLabel[item.stockStatus as StockStatus]?.class || ''}`}>
                        ● {stockLabel[item.stockStatus as StockStatus]?.text || item.stockStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditModal(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground text-xs sm:text-sm">Showing {((page - 1) * 8) + 1}–{Math.min(page * 8, pagination.total)} of {pagination.total}</p>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 sm:p-2 rounded-md border hover:bg-muted disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          {Array.from({ length: pagination.totalPages }, (_, i) => {
            if (pagination.totalPages > 5) {
              if (i > 0 && i < pagination.totalPages - 1 && Math.abs(i + 1 - page) > 1) {
                if (i === 1 && page > 3) return <span key={i} className="px-1 text-muted-foreground">...</span>;
                if (i === pagination.totalPages - 2 && page < pagination.totalPages - 2) return <span key={i} className="px-1 text-muted-foreground">...</span>;
                return null;
              }
            }
            return (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-xs ${page === i + 1 ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>{i + 1}</button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-1.5 sm:p-2 rounded-md border hover:bg-muted disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">{editingId ? "Edit Item" : "Add New Item"}</h2>
                  <p className="text-xs font-myanmar text-muted-foreground">{editingId ? "ပစ္စည်းပြင်ဆင်ရန်" : "ပစ္စည်းအသစ်ထည့်ရန်"}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Product Name *</label>
                  <input value={formData.nameEn} onChange={e => setFormData(p => ({ ...p, nameEn: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Enter product name" />
                </div>
                <div>
                  <label className="text-sm font-medium">SKU *</label>
                  <input value={formData.sku} onChange={e => setFormData(p => ({ ...p, sku: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g., RICE-001" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                      {categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit</label>
                    <select value={formData.unit} onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                      {units.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <input type="number" value={formData.quantity || ''} onChange={e => setFormData(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reorder Point</label>
                    <input type="number" value={formData.minStock || ''} onChange={e => setFormData(p => ({ ...p, minStock: parseInt(e.target.value) || 0 }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Warehouse</label>
                    <select value={formData.warehouseName} onChange={e => setFormData(p => ({ ...p, warehouseName: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                      {warehouses.map((w) => <option key={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit Price</label>
                    <input type="number" value={formData.unitPrice || ''} onChange={e => setFormData(p => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" placeholder="0" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="gold-button flex items-center gap-2 disabled:opacity-70">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Update Item" : "Save Item"}
                </button>
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
              <h3 className="text-lg font-bold mb-2">Delete Item</h3>
              <p className="text-sm text-muted-foreground mb-1">Are you sure you want to delete this item?</p>
              <p className="text-xs font-myanmar text-muted-foreground mb-6">ဤပစ္စည်းကို ဖျက်ရန် သေချာပါသလား?</p>
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
