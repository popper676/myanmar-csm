import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/** Accurate lat/lng for cities — Myanmar, Thailand, China */
const CITY_COORDS: Record<string, { lat: number; lng: number; mm: string }> = {
  // ─── Myanmar ───
  Yangon:      { lat: 16.8661, lng: 96.1951, mm: "ရန်ကုန်" },
  Bago:        { lat: 17.3352, lng: 96.4814, mm: "ပဲခူး" },
  Naypyidaw:   { lat: 19.7633, lng: 96.0785, mm: "နေပြည်တော်" },
  Mandalay:    { lat: 21.9588, lng: 96.0891, mm: "မန္တလေး" },
  Mawlamyine:  { lat: 16.4905, lng: 97.6285, mm: "မော်လမြိုင်" },
  Taunggyi:    { lat: 20.7893, lng: 97.0378, mm: "တောင်ကြီး" },
  Myitkyina:   { lat: 25.3867, lng: 97.3958, mm: "မြစ်ကြီးနား" },
  Pathein:     { lat: 16.7792, lng: 94.7326, mm: "ပုသိမ်" },
  Sagaing:     { lat: 21.8787, lng: 95.9785, mm: "စစ်ကိုင်း" },
  Lashio:      { lat: 22.9362, lng: 97.7499, mm: "လားရှိုး" },
  Meiktila:    { lat: 20.8814, lng: 95.8585, mm: "မိတ္ထီလာ" },
  Pyay:        { lat: 18.8240, lng: 95.2218, mm: "ပြည်" },
  Hpa_An:      { lat: 16.8907, lng: 97.6346, mm: "ဘားအံ" },
  Magway:      { lat: 20.1487, lng: 94.9196, mm: "မကွေး" },
  Dawei:       { lat: 14.0823, lng: 98.1915, mm: "ထားဝယ်" },
  Sittwe:      { lat: 20.1461, lng: 92.8984, mm: "စစ်တွေ" },
  Monywa:      { lat: 21.9139, lng: 95.1335, mm: "မုံရွာ" },
  Myeik:       { lat: 12.4394, lng: 98.6006, mm: "မြိတ်" },
  Hakha:       { lat: 22.6415, lng: 93.6162, mm: "ဟားခါး" },
  Loikaw:      { lat: 19.6747, lng: 97.2099, mm: "လွိုင်ကော်" },
  // ─── Thailand ───
  Bangkok:       { lat: 13.7563, lng: 100.5018, mm: "ဘန်ကောက်" },
  "Chiang Mai":  { lat: 18.7883, lng: 98.9853,  mm: "ချင်းမိုင်" },
  "Chiang Rai":  { lat: 19.9105, lng: 99.8406,  mm: "ချင်းရိုင်" },
  "Mae Sot":     { lat: 16.7130, lng: 98.5708,  mm: "မဲဆောက်" },
  "Hat Yai":     { lat: 7.0040,  lng: 100.4747, mm: "ဟတ်ယိုင်" },
  "Nakhon Ratchasima": { lat: 14.9799, lng: 102.0978, mm: "နခုန်ရာချစီမာ" },
  Phuket:        { lat: 7.8804,  lng: 98.3923,  mm: "ဖူးခက်" },
  "Khon Kaen":   { lat: 16.4322, lng: 102.8236, mm: "ခွန်ကဲန်" },
  Ranong:        { lat: 9.9625,  lng: 98.6385,  mm: "ရနောင်း" },
  // ─── China ───
  Kunming:     { lat: 25.0389, lng: 102.7183, mm: "ကူမင်း" },
  Ruili:       { lat: 24.0131, lng: 97.8561,  mm: "ရွှေလီ" },
  Guangzhou:   { lat: 23.1291, lng: 113.2644, mm: "ကွမ်ကျိုး" },
  Shenzhen:    { lat: 22.5431, lng: 114.0579, mm: "ရှင်ကျန်" },
  Shanghai:    { lat: 31.2304, lng: 121.4737, mm: "ရှန်ဟိုင်း" },
  Beijing:     { lat: 39.9042, lng: 116.4074, mm: "ပေကျင်း" },
  Chengdu:     { lat: 30.5728, lng: 104.0668, mm: "ချိန်တူး" },
  Nanning:     { lat: 22.8170, lng: 108.3665, mm: "နန်နင်း" },
  Chongqing:   { lat: 29.4316, lng: 106.9123, mm: "ချုံကျင့်" },
  Xiamen:      { lat: 24.4798, lng: 118.0894, mm: "ရှမင်" },
};

function resolveCity(name: string): { lat: number; lng: number; mm: string } | null {
  const direct = CITY_COORDS[name];
  if (direct) return direct;
  const lower = name.trim().toLowerCase();
  for (const [key, val] of Object.entries(CITY_COORDS)) {
    if (key.toLowerCase() === lower) return val;
  }
  return null;
}

type ShipmentStatus = "ordered" | "dispatched" | "in_transit" | "customs" | "delivered";

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  ordered:    "#6366f1",
  dispatched: "#0ea5e9",
  in_transit: "#f59e0b",
  customs:    "#ef4444",
  delivered:  "#22c55e",
};

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  ordered:    "Ordered",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  customs:    "Customs",
  delivered:  "Delivered",
};

function statusIcon(status: ShipmentStatus): L.DivIcon {
  const color = STATUS_COLORS[status] ?? "#6366f1";
  const label = STATUS_LABELS[status] ?? status;
  return L.divIcon({
    className: "shipment-map-div-icon",
    html: `<div style="
      background: ${color};
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      ${status === "in_transit" ? "animation: shipmentMapPulse 2s ease-in-out infinite;" : ""}
    ">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 12],
    popupAnchor: [0, -18],
  });
}

type ShipmentRow = {
  id: string;
  shipmentId: string;
  from: { en: string };
  to: { en: string };
  status: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
};

/** Lerp for progress marker (0→1) */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

const PROGRESS_MAP: Record<ShipmentStatus, number> = {
  ordered: 0.05,
  dispatched: 0.2,
  in_transit: 0.5,
  customs: 0.8,
  delivered: 1,
};

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });
  }, [map, bounds]);
  return null;
}

type Props = {
  cities: { en: string; mm?: string; lat?: number; lng?: number }[];
  shipments: unknown[];
};

export default function ShipmentMap({ shipments }: Props) {
  const rows: ShipmentRow[] = [];
  for (const raw of shipments) {
    const r = raw as Record<string, unknown>;
    const fromObj = r.from as { en?: string } | undefined;
    const toObj = r.to as { en?: string } | undefined;
    const fromEn = fromObj?.en ?? (r.fromEn as string | undefined);
    const toEn = toObj?.en ?? (r.toEn as string | undefined);
    const status = r.status as ShipmentStatus | undefined;
    if (!fromEn || !toEn || !status) continue;
    rows.push({
      id: String(r.id ?? ""),
      shipmentId: String(r.shipmentId ?? ""),
      from: { en: fromEn },
      to: { en: toEn },
      status,
      carrier: (r.carrier as string) ?? "",
      trackingNumber: (r.trackingNumber as string) ?? "",
    });
  }

  type RouteInfo = {
    row: ShipmentRow;
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
    color: string;
    progress: [number, number];
  };

  const routes: RouteInfo[] = [];
  const allLatLngs: [number, number][] = [];
  const drawnCities = new Set<string>();

  for (const row of rows) {
    const from = resolveCity(row.from.en);
    const to = resolveCity(row.to.en);
    if (!from || !to) continue;

    const color = STATUS_COLORS[row.status] ?? "#6366f1";
    const t = PROGRESS_MAP[row.status] ?? 0.5;
    const progressLat = lerp(from.lat, to.lat, t);
    const progressLng = lerp(from.lng, to.lng, t);

    routes.push({ row, from, to, color, progress: [progressLat, progressLng] });
    allLatLngs.push([from.lat, from.lng], [to.lat, to.lng]);
    drawnCities.add(row.from.en);
    drawnCities.add(row.to.en);
  }

  if (allLatLngs.length === 0) {
    allLatLngs.push([16.87, 96.20], [21.96, 96.09]);
  }

  const bounds = L.latLngBounds(allLatLngs.map(([lat, lng]) => L.latLng(lat, lng)));

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ minHeight: 440 }}>
      {/* Legend */}
      <div className="pointer-events-none absolute right-2 top-2 z-[1000] rounded-md border bg-white/95 px-3 py-2 text-[11px] shadow-md dark:bg-zinc-900/95 dark:border-zinc-700">
        <p className="font-bold mb-1">Route colors</p>
        {(Object.entries(STATUS_COLORS) as [ShipmentStatus, string][]).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="inline-block h-[4px] w-5 rounded-full" style={{ background: c }} />
            <span>{STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      <MapContainer center={[19.5, 96.0]} zoom={6} className="z-0 w-full" style={{ height: 440 }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds bounds={bounds} />

        {/* Draw route lines */}
        {routes.map((r, i) => (
          <Polyline
            key={`route-${r.row.id}-${i}`}
            positions={[
              [r.from.lat, r.from.lng],
              [r.to.lat, r.to.lng],
            ]}
            pathOptions={{
              color: r.color,
              weight: 5,
              opacity: 0.9,
            }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong>{r.row.shipmentId}</strong>
                <div>{r.row.from.en} → {r.row.to.en}</div>
                <div style={{ color: r.color, fontWeight: 700 }}>{STATUS_LABELS[r.row.status]}</div>
                {r.row.carrier && <div style={{ fontSize: 11 }}>Carrier: {r.row.carrier}</div>}
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* City circle markers with labels */}
        {[...drawnCities].map((cityName) => {
          const city = resolveCity(cityName);
          if (!city) return null;
          const mm = city.mm ?? "";
          return (
            <CircleMarker
              key={`city-${cityName}`}
              center={[city.lat, city.lng]}
              radius={8}
              pathOptions={{ color: "#1e293b", weight: 3, fillColor: "#ffffff", fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]} className="city-label-tooltip">
                <span style={{ fontWeight: 700, fontSize: 12 }}>{cityName}</span>
                {mm && <span style={{ display: "block", fontSize: 10, opacity: 0.7 }}>{mm}</span>}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Progress markers on route */}
        {routes.map((r, i) => (
          <Marker
            key={`prog-${r.row.id}-${i}`}
            position={r.progress}
            icon={statusIcon(r.row.status)}
            zIndexOffset={900}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <strong>{r.row.shipmentId}</strong>
                <div>{r.row.from.en} → {r.row.to.en}</div>
                <div style={{ color: r.color, fontWeight: 700 }}>{STATUS_LABELS[r.row.status]}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <p className="pointer-events-none absolute bottom-1 left-2 right-2 text-[9px] text-muted-foreground opacity-70">
        © OpenStreetMap contributors · Free tiles, no API key.
      </p>
    </div>
  );
}
