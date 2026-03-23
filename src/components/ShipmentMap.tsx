import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ShipmentStatus } from "@/data/dummy-data";
import { shipmentApi } from "@/lib/api";
import { pointAtFractionAlongPolyline, slicePolylineFromFraction, slicePolylineToFraction } from "@/lib/routePolyline";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export type MapCity = {
  en: string;
  mm: string;
  lat: number;
  lng: number;
};

type ShipmentLike = {
  id: string;
  shipmentId: string;
  from: { en: string };
  to: { en: string };
  status: ShipmentStatus;
};

/** Accept API shape with nested `from`/`to` or legacy flat fields */
export function normalizeShipmentForMap(raw: Record<string, unknown>): ShipmentLike | null {
  const fromObj = raw.from as { en?: string } | undefined;
  const toObj = raw.to as { en?: string } | undefined;
  const fromEn = fromObj?.en ?? (raw.fromEn as string | undefined);
  const toEn = toObj?.en ?? (raw.toEn as string | undefined);
  const status = raw.status as ShipmentStatus | undefined;
  const id = String(raw.id ?? "");
  const shipmentId = String(raw.shipmentId ?? "");
  if (!fromEn || !toEn || !status || !id) return null;
  return {
    id,
    shipmentId,
    from: { en: fromEn },
    to: { en: toEn },
    status,
  };
}

const statusSteps: ShipmentStatus[] = ["ordered", "dispatched", "in_transit", "customs", "delivered"];

const statusLabels: Record<ShipmentStatus, string> = {
  ordered: "Ordered",
  dispatched: "Dispatched",
  in_transit: "In transit",
  customs: "Customs",
  delivered: "Delivered",
};

const statusProgress: Record<ShipmentStatus, number> = {
  ordered: 0.06,
  dispatched: 0.22,
  in_transit: 0.52,
  customs: 0.82,
  delivered: 1,
};

/** Base colors (legend + markers) */
const routeColors: Record<ShipmentStatus, string> = {
  ordered: "#64748b",
  dispatched: "#0ea5e9",
  in_transit: "#d97706",
  customs: "#ca8a04",
  delivered: "#16a34a",
};

/** HSL per status — line on map uses these so colors stay vivid; index shifts hue per shipment */
const statusLineHsl: Record<ShipmentStatus, { h: number; s: number; l: number }> = {
  ordered: { h: 215, s: 35, l: 42 },
  dispatched: { h: 199, s: 85, l: 48 },
  in_transit: { h: 28, s: 88, l: 48 },
  customs: { h: 43, s: 90, l: 42 },
  delivered: { h: 142, s: 72, l: 38 },
};

function lineColorForShipment(status: ShipmentStatus, shipmentIndex: number): string {
  const b = statusLineHsl[status] ?? statusLineHsl.ordered;
  const h = (b.h + shipmentIndex * 31) % 360;
  return `hsl(${h} ${b.s}% ${b.l}%)`;
}

function straightLine(from: MapCity, to: MapCity): [number, number][] {
  return [
    [from.lat, from.lng],
    [to.lat, to.lng],
  ];
}

function interpolate(from: MapCity, to: MapCity, t: number): [number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  return [from.lat + clamped * (to.lat - from.lat), from.lng + clamped * (to.lng - from.lng)];
}

function progressIcon(color: string, emoji: string, pulse: boolean): L.DivIcon {
  const pulseClass = pulse ? " shipment-map-marker-pulse" : "";
  return L.divIcon({
    className: "shipment-map-div-icon",
    html: `<div class="shipment-map-marker-inner${pulseClass}" style="background:${color};border-color:${color}">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -14],
  });
}

function statusEmoji(status: ShipmentStatus): string {
  switch (status) {
    case "ordered":
      return "📋";
    case "dispatched":
      return "🏭";
    case "in_transit":
      return "🚚";
    case "customs":
      return "🛃";
    case "delivered":
      return "✅";
    default:
      return "📦";
  }
}

function FitBounds({ points, maxZoom = 10 }: { points: [number, number][]; maxZoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], Math.min(maxZoom, 11));
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom });
  }, [map, points, maxZoom]);
  return null;
}

type RouteProcess = {
  key: string;
  shipmentId: string;
  status: ShipmentStatus;
  statusLabel: string;
  step: number;
  /** Marker / popup accent (hex from status) */
  color: string;
  /** Polyline color (HSL, unique per shipment when many on map) */
  lineColor: string;
  completed: [number, number][];
  remaining: [number, number][];
  markerPos: [number, number];
  icon: L.DivIcon;
  path: [number, number][];
};

export default function ShipmentMap({ cities, shipments }: { cities: MapCity[]; shipments: unknown[] }) {
  const cityMap = useMemo(() => {
    const m = new Map<string, MapCity>();
    for (const c of cities) m.set(c.en, c);
    return m;
  }, [cities]);

  const normalized = useMemo(() => {
    const out: ShipmentLike[] = [];
    for (const raw of shipments) {
      const n = normalizeShipmentForMap(raw as Record<string, unknown>);
      if (n) out.push(n);
    }
    return out;
  }, [shipments]);

  const [pathsById, setPathsById] = useState<Record<string, [number, number][]>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const pairKey = (from: MapCity, to: MapCity) =>
        `${from.lat.toFixed(4)},${from.lng.toFixed(4)}|${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
      const uniquePairs = new Map<string, { from: MapCity; to: MapCity; ids: string[] }>();

      for (const s of normalized) {
        const from = cityMap.get(s.from.en);
        const to = cityMap.get(s.to.en);
        if (!from || !to) continue;
        const k = pairKey(from, to);
        if (!uniquePairs.has(k)) uniquePairs.set(k, { from, to, ids: [] });
        uniquePairs.get(k)!.ids.push(s.id);
      }

      const updates: Record<string, [number, number][]> = {};

      await Promise.all(
        [...uniquePairs.values()].map(async ({ from, to, ids }) => {
          try {
            const res = await shipmentApi.routeGeometry({
              fromLat: from.lat,
              fromLng: from.lng,
              toLat: to.lat,
              toLng: to.lng,
            });
            const coords = res.coordinates?.length ? res.coordinates : straightLine(from, to);
            for (const id of ids) updates[id] = coords;
          } catch {
            const line = straightLine(from, to);
            for (const id of ids) updates[id] = line;
          }
        }),
      );

      if (!cancelled) {
        setPathsById((prev) => ({ ...prev, ...updates }));
      }
    }

    if (normalized.length > 0 && cities.length > 0) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [normalized, cityMap, cities.length]);

  const routes: RouteProcess[] = useMemo(() => {
    const out: RouteProcess[] = [];
    let shipmentIndex = 0;
    for (const s of normalized) {
      const from = cityMap.get(s.from.en);
      const to = cityMap.get(s.to.en);
      if (!from || !to) continue;

      const path = pathsById[s.id] ?? straightLine(from, to);
      const t = statusProgress[s.status] ?? 0;
      const color = routeColors[s.status] ?? "#64748b";
      const lineColor = lineColorForShipment(s.status, shipmentIndex);
      shipmentIndex += 1;
      const step = statusSteps.indexOf(s.status);
      const pulse = s.status === "in_transit";

      let completed: [number, number][];
      let remaining: [number, number][];
      let markerPos: [number, number];

      if (path.length >= 2) {
        completed = slicePolylineToFraction(path, t);
        remaining = slicePolylineFromFraction(path, t);
        markerPos = pointAtFractionAlongPolyline(path, t);
      } else {
        completed = [interpolate(from, to, 0), interpolate(from, to, t)];
        remaining = [interpolate(from, to, t), interpolate(from, to, 1)];
        markerPos = interpolate(from, to, t);
      }

      out.push({
        key: s.id,
        shipmentId: s.shipmentId,
        status: s.status,
        statusLabel: statusLabels[s.status],
        step: step >= 0 ? step + 1 : 1,
        color,
        lineColor,
        completed,
        remaining,
        markerPos,
        icon: progressIcon(color, statusEmoji(s.status), pulse),
        path,
      });
    }
    return out;
  }, [normalized, cityMap, pathsById]);

  /** Fit map to shipment routes (not every city) so Bago→Yangon is visible */
  const fitPoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (const r of routes) {
      for (const p of r.path) pts.push(p);
    }
    if (pts.length === 0) {
      return cities.map((c) => [c.lat, c.lng] as [number, number]);
    }
    return pts;
  }, [routes, cities]);

  const center: [number, number] = [19.5, 96.0];

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/30" style={{ minHeight: 420 }}>
      <div className="pointer-events-none absolute right-2 top-2 z-[400] max-w-[200px] rounded-md border border-border bg-card/95 px-2.5 py-2 text-[10px] shadow-sm backdrop-blur-sm sm:max-w-none">
        <p className="font-semibold text-foreground">Shipment routes</p>
        <p className="mt-1 text-muted-foreground">
          Each colored line is one shipment (hue by status; shifts if several share a status). Faint underlay = full path; bold = completed; dashed = remaining.
        </p>
        <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
          <li>
            <span className="inline-block h-2 w-4 rounded-sm align-middle" style={{ background: routeColors.ordered }} /> Ordered
          </li>
          <li>
            <span className="inline-block h-2 w-4 rounded-sm align-middle" style={{ background: routeColors.dispatched }} /> Dispatched
          </li>
          <li>
            <span className="inline-block h-2 w-4 rounded-sm align-middle" style={{ background: routeColors.in_transit }} /> In transit
          </li>
          <li>
            <span className="inline-block h-2 w-4 rounded-sm align-middle" style={{ background: routeColors.customs }} /> Customs
          </li>
          <li>
            <span className="inline-block h-2 w-4 rounded-sm align-middle" style={{ background: routeColors.delivered }} /> Delivered
          </li>
        </ul>
      </div>

      <MapContainer center={center} zoom={6} className="z-0 h-[420px] w-full" scrollWheelZoom attributionControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitPoints.length > 0 && <FitBounds points={fitPoints} maxZoom={routes.length <= 2 ? 11 : 9} />}

        {/* Full route underlay (shipment-colored, subtle) */}
        {routes.map((r) => (
          <Polyline
            key={`${r.key}-full`}
            positions={r.path}
            pathOptions={{
              color: r.lineColor,
              weight: 12,
              opacity: 0.22,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ))}

        {/* Remaining leg — dashed, same shipment color (not gray) */}
        {routes.map((r) =>
          r.status === "delivered" ? null : (
            <Polyline
              key={`${r.key}-remain`}
              positions={r.remaining}
              pathOptions={{
                color: r.lineColor,
                weight: 5,
                opacity: 0.42,
                dashArray: "12 10",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          ),
        )}

        {/* Completed leg — bold, full opacity */}
        {routes.map((r) => (
          <Polyline
            key={`${r.key}-done`}
            positions={r.completed}
            pathOptions={{
              color: r.lineColor,
              weight: 7,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ))}

        {cities.map((city) => (
          <Marker key={city.en} position={[city.lat, city.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>{city.en}</strong>
                <div className="font-myanmar text-muted-foreground">{city.mm}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {routes.map((r) => (
          <Marker key={`${r.key}-prog`} position={r.markerPos} icon={r.icon} zIndexOffset={800}>
            <Popup>
              <div className="min-w-[160px] text-sm">
                <p className="font-mono text-xs text-muted-foreground">{r.shipmentId}</p>
                <p className="mt-1 font-semibold">{r.statusLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Step {r.step} of {statusSteps.length} · Progress along route
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <p className="pointer-events-none absolute bottom-2 left-2 right-2 rounded bg-background/90 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm sm:pr-[220px]">
        Map © OpenStreetMap · Road paths via OSRM (demo) when available.
      </p>
    </div>
  );
}
