import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ShipmentStatus } from "@/data/dummy-data";

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

const statusSteps: ShipmentStatus[] = ["ordered", "dispatched", "in_transit", "customs", "delivered"];

const statusLabels: Record<ShipmentStatus, string> = {
  ordered: "Ordered",
  dispatched: "Dispatched",
  in_transit: "In transit",
  customs: "Customs",
  delivered: "Delivered",
};

/** How far along the route (0–1) each stage represents */
const statusProgress: Record<ShipmentStatus, number> = {
  ordered: 0.06,
  dispatched: 0.22,
  in_transit: 0.52,
  customs: 0.82,
  delivered: 1,
};

const routeColors: Record<ShipmentStatus, string> = {
  ordered: "#64748b",
  dispatched: "#0ea5e9",
  in_transit: "#d97706",
  customs: "#ca8a04",
  delivered: "#16a34a",
};

function interpolate(from: MapCity, to: MapCity, t: number): [number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  return [from.lat + clamped * (to.lat - from.lat), from.lng + clamped * (to.lng - from.lng)];
}

function progressIcon(
  color: string,
  emoji: string,
  pulse: boolean,
): L.DivIcon {
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

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 8);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }, [map, points]);
  return null;
}

type RouteProcess = {
  key: string;
  shipmentId: string;
  status: ShipmentStatus;
  statusLabel: string;
  step: number;
  color: string;
  completed: [number, number][];
  remaining: [number, number][];
  markerPos: [number, number];
  icon: L.DivIcon;
};

export default function ShipmentMap({ cities, shipments }: { cities: MapCity[]; shipments: ShipmentLike[] }) {
  const cityByEn = useMemo(() => {
    const m = new Map<string, MapCity>();
    for (const c of cities) m.set(c.en, c);
    return m;
  }, [cities]);

  const boundsPoints = useMemo(() => cities.map((c) => [c.lat, c.lng] as [number, number]), [cities]);

  const routes: RouteProcess[] = useMemo(() => {
    const out: RouteProcess[] = [];
    for (const s of shipments) {
      const from = cityByEn.get(s.from.en);
      const to = cityByEn.get(s.to.en);
      if (!from || !to) continue;

      const t = statusProgress[s.status] ?? 0;
      const progressPos = interpolate(from, to, t);
      const color = routeColors[s.status] ?? "#64748b";
      const step = statusSteps.indexOf(s.status);
      const pulse = s.status === "in_transit";

      out.push({
        key: s.id,
        shipmentId: s.shipmentId,
        status: s.status,
        statusLabel: statusLabels[s.status],
        step: step >= 0 ? step + 1 : 1,
        color,
        completed: [
          [from.lat, from.lng],
          progressPos,
        ],
        remaining: [progressPos, [to.lat, to.lng]],
        markerPos: progressPos,
        icon: progressIcon(color, statusEmoji(s.status), pulse),
      });
    }
    return out;
  }, [shipments, cityByEn]);

  const center: [number, number] = [19.5, 96.0];

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/30" style={{ minHeight: 420 }}>
      <div className="pointer-events-none absolute right-2 top-2 z-[400] max-w-[200px] rounded-md border border-border bg-card/95 px-2.5 py-2 text-[10px] shadow-sm backdrop-blur-sm sm:max-w-none">
        <p className="font-semibold text-foreground">Shipment progress</p>
        <p className="mt-1 text-muted-foreground">
          Solid line = completed; dashed = remaining. Marker = current stage along the route.
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

      <MapContainer
        center={center}
        zoom={6}
        className="z-0 h-[420px] w-full"
        scrollWheelZoom
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {boundsPoints.length > 0 && <FitBounds points={boundsPoints} />}

        {/* Remaining journey (not yet reached at current status) — hidden when delivered */}
        {routes.map((r) =>
          r.status === "delivered" ? null : (
            <Polyline
              key={`${r.key}-remain`}
              positions={r.remaining}
              pathOptions={{
                color: "#94a3b8",
                weight: 3,
                opacity: 0.45,
                dashArray: "10 8",
                lineCap: "round",
              }}
            />
          ),
        )}

        {/* Completed portion at current process stage */}
        {routes.map((r) => (
          <Polyline
            key={`${r.key}-done`}
            positions={r.completed}
            pathOptions={{
              color: r.color,
              weight: 5,
              opacity: 0.92,
              lineCap: "round",
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
        Map data © OpenStreetMap contributors — free tiles, no API key required.
      </p>
    </div>
  );
}
