import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Filter, Truck, Loader2 } from "lucide-react";
import { shipmentApi } from "@/lib/api";
import type { ShipmentStatus } from "@/data/dummy-data";

const statusSteps: ShipmentStatus[] = ["ordered", "dispatched", "in_transit", "customs", "delivered"];
const statusLabels: Record<ShipmentStatus, string> = { ordered: "Ordered", dispatched: "Dispatched", in_transit: "In Transit", customs: "Customs", delivered: "Delivered" };
const statusColors: Record<ShipmentStatus, string> = { ordered: "bg-muted-foreground", dispatched: "bg-info", in_transit: "bg-accent", customs: "bg-warning-dark", delivered: "bg-success" };

export default function Shipments() {
  const routeLocation = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routeLocation.state?.openCreate === 'create-shipment') {
      setShowAdd(true);
      window.history.replaceState({}, '');
    }
  }, [routeLocation.state]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const data = await shipmentApi.list(params);
      setShipments(data);
    } catch (err) {
      console.error("Failed to fetch shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [statusFilter]);

  useEffect(() => {
    shipmentApi.cities().then(setCities).catch(console.error);
  }, []);

  const [newShipment, setNewShipment] = useState({ from: '', to: '', carrier: '', dispatchDate: '', eta: '' });

  const handleCreateShipment = async () => {
    const fromCity = cities.find((c: any) => newShipment.from.startsWith(c.en));
    const toCity = cities.find((c: any) => newShipment.to.startsWith(c.en));
    if (!fromCity || !toCity || !newShipment.carrier || !newShipment.dispatchDate || !newShipment.eta) {
      console.error("Please fill all fields");
      return;
    }
    try {
      await shipmentApi.create({
        fromEn: fromCity.en,
        fromMm: fromCity.mm,
        toEn: toCity.en,
        toMm: toCity.mm,
        carrier: newShipment.carrier,
        dispatchDate: newShipment.dispatchDate,
        eta: newShipment.eta,
      });
      setShowAdd(false);
      setNewShipment({ from: '', to: '', carrier: '', dispatchDate: '', eta: '' });
      fetchShipments();
    } catch (err) {
      console.error("Failed to create shipment:", err);
    }
  };

  if (loading && shipments.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Shipment Tracking</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-myanmar">ပေးပို့မှု ခြေရာခံမှု</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="gold-button flex items-center gap-2 self-start text-sm">
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
            {cities.map((city: any) => (
              <g key={city.en}>
                <circle cx={city.x} cy={city.y} r="2.5" fill="hsl(var(--primary))" className="drop-shadow-sm" />
                <text x={city.x} y={city.y - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: "3px", fontWeight: 600 }}>{city.en}</text>
                <text x={city.x} y={city.y + 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "2.5px", fontFamily: "'Noto Sans Myanmar'" }}>{city.mm}</text>
              </g>
            ))}
            {/* Active shipment indicators */}
            {shipments.filter((s: any) => s.status === "in_transit").map((s: any) => {
              const from = cities.find((c: any) => c.en === s.from.en);
              const to = cities.find((c: any) => c.en === s.to.en);
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
        {shipments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-myanmar">ပေးပို့မှု မရှိသေးပါ</p>
            <p className="text-xs mt-1">No shipments found</p>
          </div>
        ) : shipments.map((shipment: any, i: number) => (
          <motion.div key={shipment.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-elevated p-3 sm:p-5">
            <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-mono-data text-[10px] sm:text-xs text-muted-foreground">{shipment.shipmentId}</p>
                <p className="text-xs sm:text-sm font-semibold mt-1">
                  {shipment.from.en} → {shipment.to.en}
                </p>
              </div>
              {shipment.daysRemaining > 0 && (
                <span className="text-[10px] sm:text-xs font-medium bg-accent/20 text-accent-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-myanmar whitespace-nowrap flex-shrink-0">
                  {shipment.daysRemaining} ရက်
                </span>
              )}
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-0.5 sm:gap-1 mb-3 sm:mb-4">
              {statusSteps.map((step, si) => {
                const currentIdx = statusSteps.indexOf(shipment.status);
                const isActive = si === currentIdx;
                const isPast = si < currentIdx;
                return (
                  <div key={step} className="flex items-center gap-0.5 sm:gap-1 flex-1">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${isPast || isActive ? statusColors[shipment.status] : "bg-muted"} ${isActive ? "animate-pulse-dot" : ""}`} />
                    {si < statusSteps.length - 1 && <div className={`h-0.5 flex-1 ${isPast ? statusColors[shipment.status] : "bg-muted"}`} />}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] sm:text-[10px] text-muted-foreground mb-3 sm:mb-4">
              {statusSteps.map((s) => <span key={s}>{statusLabels[s]}</span>)}
            </div>

            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground border-t pt-2 sm:pt-3">
              <div className="min-w-0 flex-1 mr-2">
                <span className="font-medium text-foreground">{shipment.carrier}</span>
                <p className="font-mono-data mt-0.5 truncate">{shipment.trackingNumber}</p>
              </div>
              <div className="text-right flex-shrink-0">
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
                <div>
                  <label className="text-sm font-medium">From</label>
                  <select value={newShipment.from} onChange={e => setNewShipment(s => ({ ...s, from: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                    <option value="">Select origin...</option>
                    {cities.map((c: any) => <option key={c.en} value={`${c.en} (${c.mm})`}>{c.en} ({c.mm})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">To</label>
                  <select value={newShipment.to} onChange={e => setNewShipment(s => ({ ...s, to: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm">
                    <option value="">Select destination...</option>
                    {cities.map((c: any) => <option key={c.en} value={`${c.en} (${c.mm})`}>{c.en} ({c.mm})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Carrier</label>
                  <input type="text" value={newShipment.carrier} onChange={e => setNewShipment(s => ({ ...s, carrier: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" placeholder="e.g., Myanmar Express Logistics" />
                </div>
                <div>
                  <label className="text-sm font-medium">Dispatch Date</label>
                  <input type="date" value={newShipment.dispatchDate} onChange={e => setNewShipment(s => ({ ...s, dispatchDate: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Expected Arrival</label>
                  <input type="date" value={newShipment.eta} onChange={e => setNewShipment(s => ({ ...s, eta: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
                <button onClick={handleCreateShipment} className="gold-button">Add Shipment</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
