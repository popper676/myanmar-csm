import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Star, List, LayoutGrid, MapPin, Phone, Mail, X } from "lucide-react";
import { suppliers } from "@/data/dummy-data";
import { AnimatePresence } from "framer-motion";

export default function Suppliers() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const cats = [...new Set(suppliers.map((s) => s.category))];
  const filtered = suppliers.filter((s) => {
    const matchSearch = !search || s.nameEn.toLowerCase().includes(search.toLowerCase()) || s.nameMm.includes(search);
    const matchCat = !catFilter || s.category === catFilter;
    const matchRegion = !regionFilter || s.region === regionFilter;
    return matchSearch && matchCat && matchRegion;
  });

  const detail = selectedSupplier ? suppliers.find((s) => s.id === selectedSupplier) : null;

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "fill-accent text-accent" : "text-muted"}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Supplier Management</h1>
          <p className="text-sm text-muted-foreground font-myanmar">ကုန်ပေးသူများ စီမံခန့်ခွဲမှု</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="gold-button flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." className="w-full pl-10 pr-4 py-2 rounded-md border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 rounded-md border bg-card text-sm">
          <option value="">All Categories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="px-3 py-2 rounded-md border bg-card text-sm">
          <option value="">All Regions</option>
          <option value="upper">Upper Myanmar</option>
          <option value="lower">Lower Myanmar</option>
        </select>
        <div className="flex gap-1 border rounded-md p-1">
          <button onClick={() => setView("grid")} className={`p-1.5 rounded ${view === "grid" ? "bg-muted" : ""}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setView("list")} className={`p-1.5 rounded ${view === "list" ? "bg-muted" : ""}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Grid/List */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card-elevated p-5 cursor-pointer hover:border-accent/50" onClick={() => setSelectedSupplier(s.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{s.nameEn.charAt(0)}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s.category}</span>
              </div>
              <h3 className="font-semibold">{s.nameEn}</h3>
              <p className="text-xs font-myanmar text-muted-foreground">{s.nameMm}</p>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{s.township}, {s.city}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <StarRating rating={s.rating} />
                <span className="text-xs text-muted-foreground">{s.totalOrders} orders</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3 text-left font-medium text-muted-foreground">Supplier</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Location</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Rating</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Orders</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedSupplier(s.id)}>
                  <td className="p-3"><p className="font-medium">{s.nameEn}</p><p className="text-xs font-myanmar text-muted-foreground">{s.nameMm}</p></td>
                  <td className="p-3 text-muted-foreground text-xs">{s.township}, {s.city}</td>
                  <td className="p-3 text-muted-foreground">{s.category}</td>
                  <td className="p-3"><StarRating rating={s.rating} /></td>
                  <td className="p-3 text-right font-mono-data">{s.totalOrders}</td>
                  <td className="p-3 text-xs text-muted-foreground">{s.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplier Detail Drawer */}
      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-foreground/50" onClick={() => setSelectedSupplier(null)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-md bg-card h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">{detail.nameEn}</h2>
                    <p className="text-sm font-myanmar text-muted-foreground">{detail.nameMm}</p>
                  </div>
                  <button onClick={() => setSelectedSupplier(null)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{detail.township}, {detail.city}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{detail.phone}</span></div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{detail.email}</span></div>
                  <div className="flex items-center gap-2"><span className="text-sm font-medium">Rating:</span><StarRating rating={detail.rating} /><span className="text-sm text-muted-foreground">({detail.rating})</span></div>
                </div>

                <h3 className="font-semibold mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-md bg-muted">
                    <p className="text-2xl font-bold text-primary">{detail.onTimeDelivery}%</p>
                    <p className="text-xs text-muted-foreground">On-time Delivery</p>
                  </div>
                  <div className="p-4 rounded-md bg-muted">
                    <p className="text-2xl font-bold text-primary">{detail.avgLeadTime} days</p>
                    <p className="text-xs text-muted-foreground">Avg Lead Time</p>
                  </div>
                  <div className="p-4 rounded-md bg-muted">
                    <p className="text-2xl font-bold text-primary">{detail.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                  </div>
                  <div className="p-4 rounded-md bg-muted">
                    <p className="text-2xl font-bold text-accent">{detail.category}</p>
                    <p className="text-xs text-muted-foreground">Category</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Add Supplier</h2>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                {["Name (English)", "Name (Myanmar)", "Phone", "Email", "Address", "Business Type", "Payment Terms"].map((f) => (
                  <div key={f}>
                    <label className="text-sm font-medium">{f}</label>
                    <input className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <textarea className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" rows={3} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button className="gold-button">Save Supplier</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
