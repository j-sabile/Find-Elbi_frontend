import type { IBuilding } from "../interfaces/IBuilding";

/**
 * Converts Latitude and Longitude to UTM coordinates.
 * Using standard USGS formulation for Transverse Mercator.
 */
export function latLngToUTM(lat: number, lon: number): { easting: number; northing: number; zoneNum: number; zoneLetter: string } {
  const sa = 6378137.0; // WGS84 semi-major axis
  const sb = 6356752.314245; // WGS84 semi-minor axis
  const e2 = (sa * sa - sb * sb) / (sa * sa);
  const e2cuadrat = e2 / (1 - e2);
  const c = (sa * sa) / sb;

  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  let zoneNum = Math.floor((lon + 180) / 6) + 1;
  // Handle special zones
  if (lat >= 56.0 && lat < 64.0 && lon >= 3.0 && lon < 12.0) zoneNum = 32;
  if (lat >= 72.0 && lat < 84.0) {
    if (lon >= 0.0 && lon < 9.0) zoneNum = 31;
    else if (lon >= 9.0 && lon < 21.0) zoneNum = 33;
    else if (lon >= 21.0 && lon < 37.0) zoneNum = 35;
    else if (lon >= 37.0 && lon < 49.0) zoneNum = 37;
  }

  const lonOrigin = (zoneNum - 1) * 6 - 180 + 3; // center meridian
  const lonOriginRad = (lonOrigin * Math.PI) / 180;

  // UTM zone letter designator
  let zoneLetter = "N"; // Default for northern hemisphere at UPLB
  if (lat >= 84) zoneLetter = "Z";
  else if (lat >= 72) zoneLetter = "X";
  else if (lat >= 64) zoneLetter = "W";
  else if (lat >= 56) zoneLetter = "V";
  else if (lat >= 48) zoneLetter = "U";
  else if (lat >= 40) zoneLetter = "T";
  else if (lat >= 32) zoneLetter = "S";
  else if (lat >= 24) zoneLetter = "R";
  else if (lat >= 16) zoneLetter = "Q";
  else if (lat >= 8) zoneLetter = "P";
  else if (lat >= 0) zoneLetter = "N";
  else if (lat >= -8) zoneLetter = "M";
  else if (lat >= -16) zoneLetter = "L";
  else if (lat >= -24) zoneLetter = "K";
  else if (lat >= -32) zoneLetter = "J";
  else if (lat >= -40) zoneLetter = "H";
  else if (lat >= -48) zoneLetter = "G";
  else if (lat >= -56) zoneLetter = "F";
  else if (lat >= -64) zoneLetter = "E";
  else if (lat >= -72) zoneLetter = "D";
  else if (lat >= -80) zoneLetter = "C";
  else zoneLetter = "Z";

  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);
  const tanLat = Math.tan(latRad);

  const H = lonRad - lonOriginRad;
  const H2 = H * H;
  const H3 = H2 * H;
  const H4 = H3 * H;
  const H5 = H4 * H;
  const H6 = H5 * H;

  const N = c / Math.sqrt(1 + e2cuadrat * cosLat * cosLat);
  const T = tanLat * tanLat;
  const C = e2cuadrat * cosLat * cosLat;
  const A = cosLat * H;
  const A2 = A * A;
  const A3 = A2 * A;
  const A4 = A3 * A;
  const A5 = A4 * A;
  const A6 = A5 * A;

  // Meridional Arc Length
  const M = sa * (
    (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * latRad -
    (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * latRad) +
    (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * latRad) -
    (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * latRad)
  );

  const k0 = 0.9996; // scale factor

  // Easting
  const easting = k0 * N * (
    A +
    (1 - T + C) * A3 / 6 +
    (5 - 18 * T + T * T + 72 * C - 58 * e2cuadrat) * A5 / 120
  ) + 500000.0; // False Easting

  // Northing
  let northing = k0 * (
    M +
    N * tanLat * (
      A2 / 2 +
      (5 - T + 9 * C + 4 * C * C) * A4 / 24 +
      (61 - 58 * T + T * T + 600 * C - 330 * e2cuadrat) * A6 / 720
    )
  );
  if (lat < 0) {
    northing += 10000000.0; // False Northing for Southern Hemisphere
  }

  return { easting, northing, zoneNum, zoneLetter };
}

/**
 * Converts Latitude and Longitude to Web Mercator (EPSG:3857) meters coordinates.
 */
export function latLngToWebMercator(lat: number, lon: number): { x: number; y: number } {
  const r = 6378137.0; // Earth radius in meters
  const x = lon * (Math.PI / 180) * r;
  const y = Math.log(Math.tan((90 + lat) * (Math.PI / 360))) * r;
  return { x, y };
}

/**
 * Calculates the geodesic distance between two points in meters using the Haversine formula.
 */
export function getHaversineDistance(p1: [number, number], p2: [number, number]): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the area of a polygon in square meters.
 * Projects coordinates to UTM Zone 51N to perform standard Shoelace area computation.
 */
export function calculatePolygonArea(polygon: [number, number][]): number {
  if (polygon.length < 3) return 0;
  // Project all points to UTM Zone 51N coordinates (meters)
  const coords = polygon.map(([lat, lng]) => {
    const { easting, northing } = latLngToUTM(lat, lng);
    return { x: easting, y: northing };
  });

  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i].x * coords[j].y;
    area -= coords[j].x * coords[i].y;
  }
  return Math.abs(area) / 2.0;
}

/**
 * Calculates the perimeter of a polygon in meters.
 * Calculates geodesic distance between consecutive vertices.
 */
export function calculatePolygonPerimeter(polygon: [number, number][]): number {
  if (polygon.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < polygon.length; i++) {
    const nextIdx = (i + 1) % polygon.length;
    perimeter += getHaversineDistance(polygon[i], polygon[nextIdx]);
  }
  return perimeter;
}

/**
 * Generates the Well-Known Text (WKT) representation of a polygon coordinate array.
 */
export function toWKT(polygon: [number, number][]): string {
  if (polygon.length === 0) return "POLYGON EMPTY";
  // Copy and ensure closed loop
  const points = [...polygon];
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    points.push(first);
  }
  // WKT format uses: POLYGON((lng1 lat1, lng2 lat2, ..., lng1 lat1))
  const coordStrings = points.map(([lat, lng]) => `${lng.toFixed(6)} ${lat.toFixed(6)}`);
  return `POLYGON((${coordStrings.join(", ")}))`;
}

/**
 * Generates the GeoJSON representation of a building polygon feature.
 */
export function toGeoJSON(building: IBuilding): string {
  const coords = building.polygon.map(([lat, lng]) => [lng, lat]); // GeoJSON expects [lng, lat]
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push(first);
  }

  const properties: Record<string, any> = {
    id: building.id,
    name: building.name,
    type: building.type,
    address: building.address,
  };

  if ("college" in building) {
    properties.college = building.college;
  }

  const feature = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
    properties,
  };

  return JSON.stringify(feature, null, 2);
}

/**
 * Performs proximity analysis to find the nearest building of a specific category from an origin coordinate.
 */
export function findNearestBuilding(
  origin: [number, number],
  targetType: string,
  buildingsList: IBuilding[]
): { building: IBuilding; distance: number } | null {
  const filtered = buildingsList.filter((b) => b.type === targetType);
  if (filtered.length === 0) return null;

  let minDistance = Infinity;
  let nearest: IBuilding | null = null;

  filtered.forEach((building) => {
    const dist = getHaversineDistance(origin, building.marker);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = building;
    }
  });

  if (!nearest) return null;
  return { building: nearest, distance: minDistance };
}
