import * as turf from "@turf/turf";
import { flipLatLng, createRectangleFromLine, generateEquallySpacedPoints, getPointsAlongSegment } from "../utils/buildingGenerator";

export class GeometryService {
  /**
   * Calculates the geographic center of a polygon.
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
   * Generates a rectangle based on two points and a width.
   */
  static generateRectanglePoints(p1: [number, number], p2: [number, number], width: number): [number, number][] {
    const pointA = turf.point(flipLatLng(p1));
    const pointB = turf.point(flipLatLng(p2));
    const newPolygon = createRectangleFromLine(pointA, pointB, width, true);

    return [flipLatLng(newPolygon.geometry.coordinates[0][2] as unknown as [number, number]), flipLatLng(newPolygon.geometry.coordinates[0][3] as unknown as [number, number])];
  }

  /**
   * Generates equally spaced points between a segment.
   */
  static generateEquallySpaced(p1: [number, number], p2: [number, number], count: number): [number, number][] {
    const pointA = turf.point(flipLatLng(p1));
    const pointB = turf.point(flipLatLng(p2));
    const newPolygon = generateEquallySpacedPoints(pointA, pointB, count);

    const points: [number, number][] = [];
    for (const [_, coords] of newPolygon.entries()) {
      points.push(flipLatLng(coords as unknown as [number, number]));
    }
    return points;
  }

  /**
   * Generates points along a segment at a specific distance.
   */
  static generatePointsAlong(p1: [number, number], p2: [number, number], distances: number[]): [number, number][] {
    const pointA = turf.point(flipLatLng(p1));
    const pointB = turf.point(flipLatLng(p2));
    const newPolygon = getPointsAlongSegment(pointA, pointB, distances);

    const points: [number, number][] = [];
    for (const [_, coords] of newPolygon.entries()) {
      points.push(flipLatLng(coords as unknown as [number, number]));
    }
    return points;
  }

  /**
   * Splits a quadrilateral into smaller polygons based on percentages.
   *
   * @param points An array of [lat, lng] points representing the polygon (at least 4 corners).
   * @param percentages An array of numbers between 1 and 99 (e.g., [20, 40, 60]).
   * @param splitAxis 0 to split along the first pair of opposite sides, 1 for the second pair.
   * @returns An array of new closed polygons, each represented by an array of [lat, lng] points.
   */
  static splitQuadrilateralByPercentages(points: [number, number][], percentages: number[], splitAxis: 0 | 1): [number, number][][] {
    if (points.length < 4) return [points];

    const p = points.map((pt) => flipLatLng(pt));
    const corners = [p[0], p[1], p[2], p[3]];

    let edge1Start: [number, number], edge1End: [number, number];
    let edge2Start: [number, number], edge2End: [number, number];

    if (splitAxis === 0) {
      // Axis 0: Moving from P0 towards P1
      edge1Start = corners[0];
      edge1End = corners[1];
      edge2Start = corners[3];
      edge2End = corners[2]; // Opposite edge reversed to match direction
    } else {
      // Axis 1: Moving from P1 towards P2
      edge1Start = corners[1];
      edge1End = corners[2];
      edge2Start = corners[0];
      edge2End = corners[3]; // Opposite edge reversed to match direction
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
      generatedPolygons.push(polyCornersLngLat.map((coord) => flipLatLng(coord)));

      currentP0 = cutPt1;
      currentP3 = cutPt2;
    }

    const finalPolyLngLat = [currentP0, edge1End, edge2End, currentP3, currentP0];
    generatedPolygons.push(finalPolyLngLat.map((coord) => flipLatLng(coord)));

    return generatedPolygons;
  }
}
