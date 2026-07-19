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
}
