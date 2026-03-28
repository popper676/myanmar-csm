import { useState, useEffect, useCallback, useRef } from "react";
import { shipmentApi } from "@/lib/api";
import { MapPin, Loader2, Radio, RadioTower, Square } from "lucide-react";

type ShipmentOption = {
  id: string;
  shipmentId: string;
  from: { en: string };
  to: { en: string };
  status: string;
};

export default function DriverTracking() {
  const [shipments, setShipments] = useState<ShipmentOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPos, setLastPos] = useState<{ lat: number; lng: number; speed: number | null } | null>(null);
  const [sendCount, setSendCount] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    shipmentApi.list().then((data: ShipmentOption[]) => {
      const active = data.filter((s) =>
        ["dispatched", "in_transit", "customs"].includes(s.status)
      );
      setShipments(active);
      if (active.length === 1) setSelectedId(active[0].id);
    }).catch(() => setError("Failed to load shipments. Please log in first."));
  }, []);

  const startTracking = useCallback(() => {
    if (!selectedId) return;
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setError(null);
    setTracking(true);
    setSendCount(0);

    const sendPosition = (pos: GeolocationPosition) => {
      const payload = {
        shipmentId: selectedId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speed: pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6) : undefined,
        heading: pos.coords.heading ?? undefined,
        accuracy: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : undefined,
      };
      setLastPos({ lat: payload.lat, lng: payload.lng, speed: pos.coords.speed });
      shipmentApi.gpsUpdate(payload).then(() => {
        setSendCount((n) => n + 1);
      }).catch(() => { /* silent retry next interval */ });
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === 1) setError("Location permission denied. Please enable in browser settings.");
      else if (err.code === 2) setError("Location unavailable. Ensure GPS is enabled.");
      else setError("Location timeout. Retrying...");
    };

    watchIdRef.current = navigator.geolocation.watchPosition(sendPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendPosition, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      });
    }, 15000);
  }, [selectedId]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const selected = shipments.find((s) => s.id === selectedId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center pt-6 pb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-3">
            <RadioTower className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">GPS Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Share your location for live shipment tracking</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
          <div className="p-4 border-b bg-slate-50 dark:bg-zinc-800/60">
            <label className="block text-sm font-semibold mb-2">Select Shipment</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={tracking}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="">-- Choose a shipment --</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shipmentId} — {s.from.en} → {s.to.en} ({s.status})
                </option>
              ))}
            </select>
            {shipments.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">No active shipments found (dispatched, in_transit, or customs).</p>
            )}
          </div>

          <div className="p-4 space-y-4">
            {!tracking ? (
              <button
                onClick={startTracking}
                disabled={!selectedId}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-zinc-700 text-white font-semibold py-3 px-4 transition-colors text-sm"
              >
                <Radio className="w-4 h-4" />
                Start GPS Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 transition-colors text-sm"
              >
                <Square className="w-4 h-4" />
                Stop Tracking
              </button>
            )}

            {tracking && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-semibold">Tracking active</span>
                </div>
                {selected && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    Shipment: {selected.shipmentId} ({selected.from.en} → {selected.to.en})
                  </p>
                )}
                {lastPos && (
                  <div className="text-xs space-y-1 text-emerald-700 dark:text-emerald-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{lastPos.lat.toFixed(5)}, {lastPos.lng.toFixed(5)}</span>
                    </div>
                    {lastPos.speed != null && (
                      <div>Speed: {Math.round(lastPos.speed * 3.6)} km/h</div>
                    )}
                    <div>Updates sent: {sendCount}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow p-4">
          <h3 className="font-semibold text-sm mb-2">How it works</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>1. Select your active shipment above</li>
            <li>2. Tap "Start GPS Tracking" and allow location access</li>
            <li>3. Keep this page open while driving</li>
            <li>4. Your location updates every 15 seconds on the map</li>
            <li>5. The office sees your live position on the shipment map</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
