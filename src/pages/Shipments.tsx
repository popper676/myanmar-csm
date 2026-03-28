import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Truck, Loader2, Trash2 } from "lucide-react";
import { shipmentApi } from "@/lib/api";
import type { ShipmentStatus } from "@/data/dummy-data";
import ShipmentMap from "@/components/ShipmentMap";

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

  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusChange = async (shipmentId: string, newStatus: ShipmentStatus) => {
    setUpdatingStatus(shipmentId);
    try {
      await shipmentApi.updateStatus(shipmentId, newStatus);
      await fetchShipments();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteShipment = async (id: string, shipmentId: string) => {
    if (!window.confirm(`Delete shipment ${shipmentId}?`)) return;
    try {
      await shipmentApi.delete(id);
      fetchShipments();
    } catch (err) {
      console.error("Failed to delete shipment:", err);
    }
  };

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

      {/* Live map: OpenStreetMap tiles (free, no API key) */}
      <div className="card-elevated p-4 sm:p-6">
        <h3 className="font-semibold mb-1">Myanmar route map</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Routes are built from each shipment’s <strong className="text-foreground">from → to</strong> cities (road path when available).
          Solid = completed; dashed = remaining. Click a truck/status marker for details.
        </p>
        {cities.length > 0 && (
          <ShipmentMap
            cities={cities.filter((c: any) => typeof c.lat === "number" && typeof c.lng === "number")}
            shipments={shipments as unknown[]}
          />
        )}
      </div>

      {/* Shipment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shipments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-myanmar">ပေးပို့မှု မရှိသေးပါ</p>
            <p className="text-xs mt-1">No shipments found</p>
          </div>
        ) : shipments.map((shipment: any, i: number) => {
          const currentIdx = statusSteps.indexOf(shipment.status);
          const isUpdating = updatingStatus === shipment.id;
          return (
          <motion.div key={shipment.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`card-elevated p-3 sm:p-5 ${isUpdating ? "opacity-60 pointer-events-none" : ""}`}>
            <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-mono-data text-[10px] sm:text-xs text-muted-foreground">{shipment.shipmentId}</p>
                <p className="text-xs sm:text-sm font-semibold mt-1">
                  {shipment.from.en} → {shipment.to.en}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {shipment.daysRemaining > 0 && (
                  <span className="text-[10px] sm:text-xs font-medium bg-accent/20 text-accent-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-myanmar whitespace-nowrap">
                    {shipment.daysRemaining} ရက်
                  </span>
                )}
                <button
                  onClick={() => handleDeleteShipment(shipment.id, shipment.shipmentId)}
                  title="Delete shipment"
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Clickable Timeline */}
            <p className="text-[9px] text-muted-foreground mb-1.5">Click a step to update status:</p>
            <div className="flex items-center gap-0.5 sm:gap-1 mb-1">
              {statusSteps.map((step, si) => {
                const isActive = si === currentIdx;
                const isPast = si < currentIdx;
                const dotColor = isPast || isActive ? statusColors[shipment.status] : "bg-muted";
                return (
                  <div key={step} className="flex items-center gap-0.5 sm:gap-1 flex-1">
                    <button
                      onClick={() => handleStatusChange(shipment.id, step)}
                      disabled={isUpdating}
                      title={`Set to ${statusLabels[step]}`}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all
                        ${isActive ? `${dotColor} border-foreground/40 ring-2 ring-offset-1 ring-primary/30 scale-110` : ""}
                        ${isPast ? `${dotColor} border-transparent` : ""}
                        ${!isPast && !isActive ? "bg-muted border-transparent" : ""}
                        hover:scale-125 hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 cursor-pointer`}
                    >
                      {isPast && <span className="text-white text-[8px] sm:text-[10px] font-bold">✓</span>}
                      {isActive && (isUpdating
                        ? <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
                        : <span className="text-white text-[8px] sm:text-[10px] font-bold">●</span>
                      )}
                    </button>
                    {si < statusSteps.length - 1 && <div className={`h-0.5 flex-1 ${isPast ? statusColors[shipment.status] : "bg-muted"}`} />}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] sm:text-[10px] text-muted-foreground mb-3 sm:mb-4">
              {statusSteps.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(shipment.id, s)}
                  disabled={isUpdating}
                  className={`hover:text-foreground hover:font-semibold cursor-pointer transition-colors ${s === shipment.status ? "text-foreground font-bold" : ""}`}
                >
                  {statusLabels[s]}
                </button>
              ))}
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
          );
        })}
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
