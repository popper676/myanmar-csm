import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Filter, Truck } from "lucide-react";
import { shipments, myanmarCities, type ShipmentStatus } from "@/data/dummy-data";

const statusSteps: ShipmentStatus[] = ["ordered", "dispatched", "in_transit", "customs", "delivered"];
const statusLabels: Record<ShipmentStatus, string> = { ordered: "Ordered", dispatched: "Dispatched", in_transit: "In Transit", customs: "Customs", delivered: "Delivered" };
const statusColors: Record<ShipmentStatus, string> = { ordered: "bg-muted-foreground", dispatched: "bg-info", in_transit: "bg-accent", customs: "bg-warning-dark", delivered: "bg-success" };

export default function Shipments() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = statusFilter ? shipments.filter((s) => s.status === statusFilter) : shipments;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Shipment Tracking</h1>
          <p className="text-sm text-muted-foreground font-myanmar">ပေးပို့မှု ခြေရာခံမှု</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="gold-button flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Shipment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("")} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!statusFilter ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>All</button>
        {statusSteps.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>{statusLabels[s]}</button>
        ))}
      </div>

      {/* Route Map SVG */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold mb-4">Myanmar Route Network</h3>
        <div className="relative w-full" style={{ paddingBottom: "50%" }}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
            {/* Route lines */}
            {[
              [50, 80, 55, 70], [55, 70, 50, 50], [50, 50, 52, 30],
              [65, 75, 55, 70], [70, 45, 52, 30],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2 1" />
            ))}
            {/* City nodes */}
            {myanmarCities.map((city) => (
              <g key={city.en}>
                <circle cx={city.x} cy={city.y} r="2.5" fill="hsl(var(--primary))" className="drop-shadow-sm" />
                <text x={city.x} y={city.y - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: "3px", fontWeight: 600 }}>{city.en}</text>
                <text x={city.x} y={city.y + 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "2.5px", fontFamily: "'Noto Sans Myanmar'" }}>{city.mm}</text>
              </g>
            ))}
            {/* Active shipment indicators */}
            {filtered.filter((s) => s.status === "in_transit").map((s, i) => {
              const from = myanmarCities.find((c) => c.en === s.from.en);
              const to = myanmarCities.find((c) => c.en === s.to.en);
              if (!from || !to) return null;
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              return <circle key={s.id} cx={mx} cy={my} r="1.5" fill="hsl(var(--accent))" className="animate-pulse-dot" />;
            })}
          </svg>
        </div>
      </div>

      {/* Shipment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-myanmar">ပေးပို့မှု မရှိသေးပါ</p>
            <p className="text-xs mt-1">No shipments found</p>
          </div>
        ) : filtered.map((shipment, i) => (
          <motion.div key={shipment.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-elevated p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono-data text-xs text-muted-foreground">{shipment.shipmentId}</p>
                <p className="text-sm font-semibold mt-1">
                  {shipment.from.en} <span className="font-myanmar text-xs">({shipment.from.mm})</span>
                  {" → "}
                  {shipment.to.en} <span className="font-myanmar text-xs">({shipment.to.mm})</span>
                </p>
              </div>
              {shipment.daysRemaining > 0 && (
                <span className="text-xs font-medium bg-accent/20 text-accent-foreground px-2 py-1 rounded font-myanmar">
                  {shipment.daysRemaining} ရက် ကျန်
                </span>
              )}
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-1 mb-4">
              {statusSteps.map((step, si) => {
                const currentIdx = statusSteps.indexOf(shipment.status);
                const isActive = si === currentIdx;
                const isPast = si < currentIdx;
                return (
                  <div key={step} className="flex items-center gap-1 flex-1">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isPast || isActive ? statusColors[shipment.status] : "bg-muted"} ${isActive ? "animate-pulse-dot" : ""}`} />
                    {si < statusSteps.length - 1 && <div className={`h-0.5 flex-1 ${isPast ? statusColors[shipment.status] : "bg-muted"}`} />}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
              {statusSteps.map((s) => <span key={s}>{statusLabels[s]}</span>)}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
              <div>
                <span className="font-medium text-foreground">{shipment.carrier}</span>
                <p className="font-mono-data mt-0.5">{shipment.trackingNumber}</p>
              </div>
              <div className="text-right">
                <p>Dispatch: {shipment.dispatchDate}</p>
                <p>ETA: {shipment.eta}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Shipment Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Add Shipment</h2>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "From", type: "select", options: myanmarCities.map((c) => `${c.en} (${c.mm})`) },
                  { label: "To", type: "select", options: myanmarCities.map((c) => `${c.en} (${c.mm})`) },
                  { label: "Carrier", type: "text" },
                  { label: "Dispatch Date", type: "date" },
                  { label: "Expected Arrival", type: "date" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-sm font-medium">{field.label}</label>
                    {field.type === "select" ? (
                      <select className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                        {field.options?.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={field.type} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button className="gold-button">Add Shipment</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
