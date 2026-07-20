import * as turf from "@turf/turf";
import type { Feature, Polygon } from "geojson";

export class GeometryService {
  // ============================================================================
  // UTILITY & HELPER FUNCTIONS
  // ============================================================================

  /**
   * Flips coordinates between [lat, lng] and [lng, lat].
   */
  static flipLatLng([lng, lat]: [number, number]): [number, number] {
    return [lat, lng];
  }

  /**
   * Calculates the geographic center of a polygon (simple average).
   */
  static getCentroid(pts: [number, number][]): [number, number] {
    if (pts.length === 0) return [0, 0];
    let latSum = 0;
    let lngSum = 0;
    pts.forEach(([lat, lng]) => {
      latSum += lat;
      lngSum += lng;
    });
    return [parseFloat((latSum / pts.length).toFixed(6)), parseFloat((lngSum / pts.length).toFixed(6))];
  }

  /**
   * Parses a space-separated string of percentage values into an array of decimal distances
   */
  static parseNumberArray(toolParam: unknown, divisor: number = 100): number[] {
    const paramString = String(toolParam);
    return paramString
      .split(" ")
      .map((val: string) => Number(val.trim()) / divisor)
      .filter((val: number): val is number => !isNaN(val));
  }

  static getBuildingLabelPoint(polygonPoints: [number, number][]): [number, number] {
    const coordinates = [...polygonPoints];

    if (coordinates.length > 0) {
      const firstPoint = coordinates[0];
      const lastPoint = coordinates[coordinates.length - 1];

      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        coordinates.push([firstPoint[0], firstPoint[1]]);
      }
    }

    const geoJsonPolygon = turf.polygon([coordinates]);
    const labelPointFeature = turf.pointOnFeature(geoJsonPolygon);
    return labelPointFeature.geometry.coordinates as [number, number];
  }

  // ============================================================================
  // HAVERSINE (GEODESIC / SPHERICAL) METHODS
  // Uses Turf.js internally. Better for long distances (city-to-city).
  // ============================================================================

  static getRightTriangleVertexHaversine(pointA: turf.Coord, pointB: turf.Coord, angleDegrees: number, isRightSide: boolean) {
    const distanceAB = turf.distance(pointA, pointB, { units: "kilometers" });
    const bearingAB = turf.bearing(pointA, pointB);
    const angleRadians = angleDegrees * (Math.PI / 180);
    const distanceAC = distanceAB * Math.cos(angleRadians);
    let bearingAC = isRightSide ? bearingAB + angleDegrees : bearingAB - angleDegrees;
    return turf.destination(pointA, distanceAC, bearingAC, { units: "kilometers" });
  }

  static createRectangleFromLineHaversine(pointA: turf.Coord, pointB: turf.Coord, widthM: number, isRightSide: boolean): Feature<Polygon> {
    const bearingAB = turf.bearing(pointA, pointB);
    const angleOffset = isRightSide ? 90 : -90;
    const perpendicularBearing = bearingAB + angleOffset;

    const pointC = turf.destination(pointB, widthM, perpendicularBearing, { units: "meters" });
    const pointD = turf.destination(pointA, widthM, perpendicularBearing, { units: "meters" });

    return turf.polygon([[turf.getCoord(pointA), turf.getCoord(pointB), turf.getCoord(pointC), turf.getCoord(pointD), turf.getCoord(pointA)]]);
  }

  static generateRectanglePointsHaversine(p1: [number, number], p2: [number, number], width: number, isRightSide: boolean = true): [number, number][] {
    const pointA = turf.point(this.flipLatLng(p1));
    const pointB = turf.point(this.flipLatLng(p2));
    const newPolygon = this.createRectangleFromLineHaversine(pointA, pointB, width, isRightSide);

    return [p1, p2, this.flipLatLng(newPolygon.geometry.coordinates[0][2] as unknown as [number, number]), this.flipLatLng(newPolygon.geometry.coordinates[0][3] as unknown as [number, number])];
  }

  static getPointsAlongSegmentHaversine(pointA: turf.Coord, pointB: turf.Coord, fractions: number[]): turf.Coord[] {
    const line = turf.lineString([turf.getCoord(pointA), turf.getCoord(pointB)]);
    const totalDistance = turf.length(line, { units: "meters" });

    return fractions.map((fraction) => {
      const distance = totalDistance * Math.max(0, Math.min(1, fraction));
      return turf.getCoord(turf.along(line, distance, { units: "meters" }));
    });
  }

  static generatePointsAlongHaversine(p1: [number, number], p2: [number, number], distances: number[]): [number, number][] {
    const pointA = turf.point(this.flipLatLng(p1));
    const pointB = turf.point(this.flipLatLng(p2));
    const rawCoords = this.getPointsAlongSegmentHaversine(pointA, pointB, distances);
    return rawCoords.map((coords) => this.flipLatLng(coords as unknown as [number, number]));
  }

  static generateEquallySpacedPointsHaversine(pointA: turf.Coord, pointB: turf.Coord, count: number): turf.Coord[] {
    if (count <= 0) return [];
    if (count === 1) return [turf.getCoord(pointA)];

    const line = turf.lineString([turf.getCoord(pointA), turf.getCoord(pointB)]);
    const totalDistance = turf.length(line, { units: "meters" });

    return Array.from({ length: count }, (_, i) => {
      const distance = (totalDistance * i) / (count - 1);
      return turf.getCoord(turf.along(line, distance, { units: "meters" }));
    });
  }

  static generateEquallySpacedHaversine(p1: [number, number], p2: [number, number], count: number): [number, number][] {
    const pointA = turf.point(this.flipLatLng(p1));
    const pointB = turf.point(this.flipLatLng(p2));
    const rawCoords = this.generateEquallySpacedPointsHaversine(pointA, pointB, count);
    return rawCoords.map((coords) => this.flipLatLng(coords as unknown as [number, number]));
  }

  static splitQuadrilateralByPercentagesHaversine(points: [number, number][], percentages: number[], splitAxis: 0 | 1): [number, number][][] {
    if (points.length < 4) return [points];

    const p = points.map((pt) => this.flipLatLng(pt));
    const corners = [p[0], p[1], p[2], p[3]];

    let edge1Start: [number, number], edge1End: [number, number];
    let edge2Start: [number, number], edge2End: [number, number];

    if (splitAxis === 0) {
      edge1Start = corners[0];
      edge1End = corners[1];
      edge2Start = corners[3];
      edge2End = corners[2];
    } else {
      edge1Start = corners[1];
      edge1End = corners[2];
      edge2Start = corners[0];
      edge2End = corners[3];
    }

    const line1 = turf.lineString([edge1Start, edge1End]);
    const line2 = turf.lineString([edge2Start, edge2End]);

    const len1 = turf.length(line1, { units: "meters" });
    const len2 = turf.length(line2, { units: "meters" });

    const sortedPercents = [...new Set(percentages)].filter((v) => v > 0 && v < 1).sort((a, b) => a - b);
    if (sortedPercents.length === 0) return [points];

    const generatedPolygons: [number, number][][] = [];
    let currentP0 = edge1Start;
    let currentP3 = edge2Start;

    for (const pct of sortedPercents) {
      const cutPt1 = turf.along(line1, len1 * pct, { units: "meters" }).geometry.coordinates as [number, number];
      const cutPt2 = turf.along(line2, len2 * pct, { units: "meters" }).geometry.coordinates as [number, number];

      const polyCornersLngLat = [currentP0, cutPt1, cutPt2, currentP3, currentP0];
      generatedPolygons.push(polyCornersLngLat.map((coord) => this.flipLatLng(coord)));

      currentP0 = cutPt1;
      currentP3 = cutPt2;
    }

    const finalPolyLngLat = [currentP0, edge1End, edge2End, currentP3, currentP0];
    generatedPolygons.push(finalPolyLngLat.map((coord) => this.flipLatLng(coord)));

    return generatedPolygons;
  }

  // ============================================================================
  // EQUIRECTANGULAR (FLAT) METHODS
  // Pythagorean/linear calculations. Extremely fast, perfect for small parcels.
  // ============================================================================

  static getRightTriangleVertexEquirectangular(pointA: [number, number], pointB: [number, number], angleDegrees: number, isRightSide: boolean): [number, number] {
    // Expects [lat, lng]
    const lat1 = pointA[0],
      lng1 = pointA[1];
    const lat2 = pointB[0],
      lng2 = pointB[1];

    const METERS_PER_DEG_LAT = 111320;
    const METERS_PER_DEG_LNG = 111320 * Math.cos(lat1 * (Math.PI / 180));

    const dy = (lat2 - lat1) * METERS_PER_DEG_LAT;
    const dx = (lng2 - lng1) * METERS_PER_DEG_LNG;

    const distAB = Math.sqrt(dx * dx + dy * dy);
    const bearingAB = Math.atan2(dx, dy);
    const angleRad = angleDegrees * (Math.PI / 180);
    const distAC = distAB * Math.cos(angleRad);

    const bearingAC = isRightSide ? bearingAB + angleRad : bearingAB - angleRad;

    const dLng = (distAC * Math.sin(bearingAC)) / METERS_PER_DEG_LNG;
    const dLat = (distAC * Math.cos(bearingAC)) / METERS_PER_DEG_LAT;

    return [lat1 + dLat, lng1 + dLng];
  }

  static generateRectanglePointsEquirectangular(p1: [number, number], p2: [number, number], widthM: number, isRightSide: boolean = true): [number, number][] {
    const lat1 = p1[0],
      lng1 = p1[1];
    const lat2 = p2[0],
      lng2 = p2[1];

    const METERS_PER_DEG_LAT = 111320;
    const METERS_PER_DEG_LNG = 111320 * Math.cos(lat1 * (Math.PI / 180));

    const dy = (lat2 - lat1) * METERS_PER_DEG_LAT;
    const dx = (lng2 - lng1) * METERS_PER_DEG_LNG;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) return [p1, p1];

    const ndx = dx / len;
    const ndy = dy / len;

    // Perpendicular vector offset
    const px = isRightSide ? ndy : -ndy;
    const py = isRightSide ? -ndx : ndx;

    const offsetX = px * widthM;
    const offsetY = py * widthM;

    const dLat = offsetY / METERS_PER_DEG_LAT;
    const dLng = offsetX / METERS_PER_DEG_LNG;

    const p3: [number, number] = [lat2 + dLat, lng2 + dLng];
    const p4: [number, number] = [lat1 + dLat, lng1 + dLng];

    return [p1, p2, p3, p4];
  }

  static generatePointsAlongEquirectangular(p1: [number, number], p2: [number, number], fractions: number[]): [number, number][] {
    return fractions.map((f) => {
      const fraction = Math.max(0, Math.min(1, f));
      return [p1[0] + (p2[0] - p1[0]) * fraction, p1[1] + (p2[1] - p1[1]) * fraction];
    });
  }

  static generateEquallySpacedEquirectangular(p1: [number, number], p2: [number, number], count: number): [number, number][] {
    if (count <= 0) return [];
    if (count === 1) return [p1, p2];
    const points: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      const fraction = i / (count - 1);
      points.push([p1[0] + (p2[0] - p1[0]) * fraction, p1[1] + (p2[1] - p1[1]) * fraction]);
    }
    return points;
  }

  static splitQuadrilateralByPercentagesEquirectangular(points: [number, number][], percentages: number[], splitAxis: 0 | 1): [number, number][][] {
    if (points.length < 4) return [points];

    const corners = [points[0], points[1], points[2], points[3]];

    let edge1Start: [number, number], edge1End: [number, number];
    let edge2Start: [number, number], edge2End: [number, number];

    if (splitAxis === 0) {
      edge1Start = corners[0];
      edge1End = corners[1];
      edge2Start = corners[3];
      edge2End = corners[2];
    } else {
      edge1Start = corners[1];
      edge1End = corners[2];
      edge2Start = corners[0];
      edge2End = corners[3];
    }

    const sortedPercents = [...new Set(percentages)].filter((v) => v > 0 && v < 1).sort((a, b) => a - b);
    if (sortedPercents.length === 0) return [points];

    const generatedPolygons: [number, number][][] = [];
    let currentP0 = edge1Start;
    let currentP3 = edge2Start;

    for (const pct of sortedPercents) {
      // Linear interpolation handles flat coordinate geometry perfectly
      const cutPt1: [number, number] = [edge1Start[0] + (edge1End[0] - edge1Start[0]) * pct, edge1Start[1] + (edge1End[1] - edge1Start[1]) * pct];
      const cutPt2: [number, number] = [edge2Start[0] + (edge2End[0] - edge2Start[0]) * pct, edge2Start[1] + (edge2End[1] - edge2Start[1]) * pct];

      generatedPolygons.push([currentP0, cutPt1, cutPt2, currentP3, currentP0]);

      currentP0 = cutPt1;
      currentP3 = cutPt2;
    }

    generatedPolygons.push([currentP0, edge1End, edge2End, currentP3, currentP0]);

    return generatedPolygons;
  }
}
