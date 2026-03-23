import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ShipmentStatus } from "@/data/dummy-data";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default marker URLs for Vite bundling
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

const routeColors: Record<ShipmentStatus, string> = {
  ordered: "#64748b",
  dispatched: "#0ea5e9",
  in_transit: "#d97706",
  customs: "#ca8a04",
  delivered: "#16a34a",
};

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 8);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 8 });
  }, [map, points]);
  return null;
}

export default function ShipmentMap({ cities, shipments }: { cities: MapCity[]; shipments: ShipmentLike[] }) {
  const cityByEn = useMemo(() => {
    const m = new Map<string, MapCity>();
    for (const c of cities) m.set(c.en, c);
    return m;
  }, [cities]);

  const boundsPoints = useMemo(() => cities.map((c) => [c.lat, c.lng] as [number, number]), [cities]);

  const routes = useMemo(() => {
    const out: { key: string; positions: [number, number][]; color: string }[] = [];
    for (const s of shipments) {
      const from = cityByEn.get(s.from.en);
      const to = cityByEn.get(s.to.en);
      if (!from || !to) continue;
      out.push({
        key: s.id,
        positions: [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ],
        color: routeColors[s.status] ?? "#64748b",
      });
    }
    return out;
  }, [shipments, cityByEn]);

  const center: [number, number] = [19.5, 96.0];

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/30" style={{ minHeight: 380 }}>
      <MapContainer
        center={center}
        zoom={6}
        className="z-0 h-[380px] w-full"
        scrollWheelZoom
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {boundsPoints.length > 0 && <FitBounds points={boundsPoints} />}

        {routes.map((r) => (
          <Polyline key={r.key} positions={r.positions} pathOptions={{ color: r.color, weight: 3, opacity: 0.85 }} />
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
      </MapContainer>

      <p className="pointer-events-none absolute bottom-2 left-2 right-2 rounded bg-background/90 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
        Map data © OpenStreetMap contributors — free tiles, no API key required.
      </p>
    </div>
  );
}
