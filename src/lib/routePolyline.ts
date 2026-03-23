/** LatLng as [lat, lng] */

export function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Points along path from start up to fraction t ∈ [0,1] of total path length */
export function slicePolylineToFraction(points: [number, number][], t: number): [number, number][] {
  if (points.length < 2) return points.length ? [[...points[0]]] : [];
  const clamped = Math.min(1, Math.max(0, t));
  const distances: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = haversineMeters(points[i], points[i + 1]);
    distances.push(d);
    total += d;
  }
  if (total === 0) return [[...points[0]]];
  const target = clamped * total;
  const out: [number, number][] = [[...points[0]]];
  let acc = 0;
  for (let i = 0; i < distances.length; i++) {
    if (acc + distances[i] >= target) {
      const localT = distances[i] === 0 ? 1 : (target - acc) / distances[i];
      out.push([
        points[i][0] + localT * (points[i + 1][0] - points[i][0]),
        points[i][1] + localT * (points[i + 1][1] - points[i][1]),
      ]);
      break;
    }
    acc += distances[i];
    out.push([...points[i + 1]]);
  }
  return out;
}

/** Points from fraction t to end of path */
export function slicePolylineFromFraction(points: [number, number][], t: number): [number, number][] {
  if (points.length < 2) return points.length ? [[...points[points.length - 1]]] : [];
  const clamped = Math.min(1, Math.max(0, t));
  const distances: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    distances.push(haversineMeters(points[i], points[i + 1]));
    total += distances[i];
  }
  if (total === 0) return [[...points[points.length - 1]]];
  const target = clamped * total;
  let acc = 0;
  for (let i = 0; i < distances.length; i++) {
    if (acc + distances[i] >= target) {
      const localT = distances[i] === 0 ? 1 : (target - acc) / distances[i];
      const start: [number, number] = [
        points[i][0] + localT * (points[i + 1][0] - points[i][0]),
        points[i][1] + localT * (points[i + 1][1] - points[i][1]),
      ];
      const rest = points.slice(i + 1) as [number, number][];
      if (rest.length === 0) return [start];
      return [start, ...rest];
    }
    acc += distances[i];
  }
  return [[...points[points.length - 1]]];
}

/** Marker position at fraction t along polyline */
export function pointAtFractionAlongPolyline(points: [number, number][], t: number): [number, number] {
  const sliced = slicePolylineToFraction(points, t);
  return sliced[sliced.length - 1];
}
