import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Trash2, Download, X, Check } from "lucide-react";
import { inventoryItems, categories, warehouses, units, formatMMK, type InventoryItem, type StockStatus } from "@/data/dummy-data";

const ITEMS_PER_PAGE = 8;

const stockLabel: Record<StockStatus, { text: string; class: string }> = {
  sufficient: { text: "Sufficient", class: "stock-sufficient" },
  low: { text: "Low", class: "stock-low" },
  critical: { text: "Critical", class: "stock-critical" },
};

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = inventoryItems.filter((item) => {
    const matchSearch = !search || item.nameEn.toLowerCase().includes(search.toLowerCase()) || item.nameMm.includes(search) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || item.category === categoryFilter;
    const matchWh = !warehouseFilter || item.warehouse === warehouseFilter;
    return matchSearch && matchCat && matchWh;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSelect = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === paged.length ? [] : paged.map((i) => i.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-muted-foreground font-myanmar">သိုလှောင်ရုံ စီမံခန့်ခွဲမှု</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="gold-button flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      {/* Filters */}
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

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-md text-sm">
          <span>{selected.length} selected</span>
          <button className="flex items-center gap-1 text-destructive hover:underline"><Trash2 className="w-3 h-3" /> Delete</button>
          <button className="flex items-center gap-1 text-primary hover:underline"><Download className="w-3 h-3" /> Export</button>
        </div>
      )}

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3 w-10"><input type="checkbox" checked={selected.length === paged.length && paged.length > 0} onChange={toggleAll} className="rounded" /></th>
                <th className="p-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Product Name</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Qty</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Unit</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Min Stock</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Warehouse</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Updated</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">
                  <p className="font-myanmar">ပစ္စည်း မရှိသေးပါ</p>
                  <p className="text-xs mt-1">No items found</p>
                </td></tr>
              ) : paged.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" /></td>
                  <td className="p-3 font-mono-data text-xs">{item.sku}</td>
                  <td className="p-3">
                    <p className="font-medium">{item.nameEn}</p>
                    <p className="text-xs font-myanmar text-muted-foreground">{item.nameMm}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{item.category}</td>
                  <td className="p-3 text-right font-mono-data">{item.quantity.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">{item.unit}</td>
                  <td className="p-3 text-right font-mono-data text-muted-foreground">{item.minStock}</td>
                  <td className="p-3 text-muted-foreground text-xs">{item.warehouse}</td>
                  <td className="p-3">
                    <span className={`text-xs font-semibold ${stockLabel[item.stockStatus].class}`}>
                      ● {stockLabel[item.stockStatus].text}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{item.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-md border hover:bg-muted disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-md text-xs ${page === i + 1 ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>{i + 1}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-md border hover:bg-muted disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">Add New Item</h2>
                  <p className="text-xs font-myanmar text-muted-foreground">ပစ္စည်းအသစ်ထည့်ရန်</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Product Name", placeholder: "Enter product name" },
                  { label: "SKU", placeholder: "e.g., RICE-001" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-sm font-medium">{f.label}</label>
                    <input className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder={f.placeholder} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                      {categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit</label>
                    <select className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                      {units.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <input type="number" className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reorder Point</label>
                    <input type="number" className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Warehouse</label>
                  <select className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                    {warehouses.map((w) => <option key={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" rows={3} placeholder="Product description..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button className="gold-button">Save Item</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
