import { useState, useEffect, useCallback, useRef } from "react";
import { shipmentApi } from "@/lib/api";
import { MapPin, Loader2, Radio, RadioTower, Square, ShieldCheck, ShieldX, ShieldQuestion, Navigation } from "lucide-react";

type ShipmentOption = {
  id: string;
  shipmentId: string;
  from: { en: string };
  to: { en: string };
  status: string;
};

type PermissionState = "checking" | "granted" | "denied" | "prompt" | "unsupported";

export default function DriverTracking() {
  const [shipments, setShipments] = useState<ShipmentOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPos, setLastPos] = useState<{ lat: number; lng: number; speed: number | null } | null>(null);
  const [sendCount, setSendCount] = useState(0);
  const [permState, setPermState] = useState<PermissionState>("checking");
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check geolocation permission on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermState("unsupported");
      return;
    }

    if (!navigator.permissions) {
      setPermState("prompt");
      return;
    }

    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      setPermState(result.state as PermissionState);
      result.addEventListener("change", () => {
        setPermState(result.state as PermissionState);
      });
    }).catch(() => {
      setPermState("prompt");
    });
  }, []);

  useEffect(() => {
    shipmentApi.list().then((data: ShipmentOption[]) => {
      const active = data.filter((s) =>
        ["dispatched", "in_transit", "customs"].includes(s.status)
      );
      setShipments(active);
      if (active.length === 1) setSelectedId(active[0].id);
    }).catch(() => setError("Failed to load shipments. Please log in first."));
  }, []);

  const requestPermission = useCallback(() => {
    setError(null);
    navigator.geolocation.getCurrentPosition(
      () => {
        setPermState("granted");
      },
      (err) => {
        if (err.code === 1) {
          setPermState("denied");
          setError("Location permission was denied. Please enable it in your browser settings and reload the page.");
        } else if (err.code === 2) {
          setError("Location unavailable. Make sure GPS/Location is enabled on your device.");
        } else {
          setError("Location request timed out. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
      }).catch(() => { /* silent — will retry next interval */ });
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === 1) {
        setPermState("denied");
        setError("Location permission denied. Please enable in browser settings and reload.");
        setTracking(false);
      } else if (err.code === 2) {
        setError("Location unavailable. Ensure GPS is enabled on your device.");
      } else {
        setError("Location timeout. Retrying...");
      }
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
  const canTrack = permState === "granted" && !!selectedId && !tracking;

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

        {/* Location Permission Status */}
        <div className={`rounded-xl border shadow-lg overflow-hidden ${
          permState === "granted" ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800" :
          permState === "denied" ? "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800" :
          permState === "unsupported" ? "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800" :
          "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800"
        }`}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              {permState === "checking" && (
                <><Loader2 className="w-5 h-5 text-amber-600 animate-spin" /><span className="font-semibold text-sm text-amber-700 dark:text-amber-400">Checking location access...</span></>
              )}
              {permState === "granted" && (
                <><ShieldCheck className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">Location access enabled</span></>
              )}
              {permState === "prompt" && (
                <><ShieldQuestion className="w-5 h-5 text-amber-600" /><span className="font-semibold text-sm text-amber-700 dark:text-amber-400">Location access required</span></>
              )}
              {permState === "denied" && (
                <><ShieldX className="w-5 h-5 text-red-600" /><span className="font-semibold text-sm text-red-700 dark:text-red-400">Location access blocked</span></>
              )}
              {permState === "unsupported" && (
                <><ShieldX className="w-5 h-5 text-red-600" /><span className="font-semibold text-sm text-red-700 dark:text-red-400">Geolocation not supported</span></>
              )}
            </div>

            {permState === "prompt" && (
              <>
                <p className="text-xs text-amber-600 dark:text-amber-500 mb-3">
                  Your browser needs permission to access your GPS location. Tap the button below — your browser will show a popup asking to allow location access.
                </p>
                <button
                  onClick={requestPermission}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-4 transition-colors text-sm"
                >
                  <Navigation className="w-4 h-4" />
                  Enable Location Access
                </button>
              </>
            )}

            {permState === "denied" && (
              <div className="text-xs text-red-600 dark:text-red-400 space-y-2">
                <p>Location permission was blocked. To fix this:</p>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                  <li>Click the <strong>lock/info icon</strong> in the browser address bar</li>
                  <li>Find <strong>"Location"</strong> and change it to <strong>"Allow"</strong></li>
                  <li><strong>Reload</strong> this page</li>
                </ol>
                <p className="pt-1 font-medium">On mobile: check your device Settings → Privacy → Location Services</p>
              </div>
            )}

            {permState === "granted" && (
              <p className="text-xs text-emerald-600 dark:text-emerald-500">
                Your browser can access GPS. Select a shipment below and start tracking.
              </p>
            )}

            {permState === "unsupported" && (
              <p className="text-xs text-red-600 dark:text-red-400">
                This browser does not support geolocation. Please use a modern browser like Chrome, Safari, or Firefox on a phone or computer with GPS.
              </p>
            )}
          </div>
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
                disabled={!canTrack}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 transition-colors text-sm"
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

            {!canTrack && !tracking && permState === "granted" && !selectedId && (
              <p className="text-xs text-center text-muted-foreground">Select a shipment above to start tracking</p>
            )}

            {!canTrack && !tracking && permState === "prompt" && (
              <p className="text-xs text-center text-amber-600 dark:text-amber-400">Enable location access above first</p>
            )}

            {tracking && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <div className="relative">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
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
            <li className="flex gap-2"><span className="font-bold text-foreground">1.</span> Enable location access (green shield = ready)</li>
            <li className="flex gap-2"><span className="font-bold text-foreground">2.</span> Select your active shipment</li>
            <li className="flex gap-2"><span className="font-bold text-foreground">3.</span> Tap "Start GPS Tracking"</li>
            <li className="flex gap-2"><span className="font-bold text-foreground">4.</span> Keep this page open while driving</li>
            <li className="flex gap-2"><span className="font-bold text-foreground">5.</span> The office sees your live position on the map</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
