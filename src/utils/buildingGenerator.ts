import * as turf from "@turf/turf";
import type { Feature, Point, Polygon } from "geojson";
// import { polygon, pointOnFeature } from "@turf/turf";

export function getRightTriangleVertex(pointA: turf.Coord, pointB: turf.Coord, angleDegrees: number, isRightSide: boolean) {
  // Step 1: Distance from A to B (in kilometers)
  const distanceAB = turf.distance(pointA, pointB, { units: "kilometers" });

  // Step 2: Bearing from A to B
  const bearingAB = turf.bearing(pointA, pointB);

  // Step 3: Calculate Distance AC using Cosine (convert degrees to radians for Math.cos)
  const angleRadians = angleDegrees * (Math.PI / 180);
  const distanceAC = distanceAB * Math.cos(angleRadians);

  // Step 4: Calculate Bearing AC
  // Add angle for right side, subtract for left side
  let bearingAC = isRightSide ? bearingAB + angleDegrees : bearingAB - angleDegrees;

  // Step 5: Find the destination coordinate (Point C)
  const pointC = turf.destination(pointA, distanceAC, bearingAC, { units: "kilometers" });

  return pointC;
  // Example Usage:
  // const A = turf.point([125.0, 6.0]); // Longitude, Latitude (e.g., General Santos)
  // const B = turf.point([121.0, 14.5]); // Longitude, Latitude (e.g., Manila)
  // const angle = 30; // 30 degrees at vertex A

  // const vertexC = getRightTriangleVertex(A, B, angle, true);
  // console.log(vertexC.geometry.coordinates); // Outputs the new [lng, lat]
}

export function createRectangleFromLine(pointA: turf.Coord, pointB: turf.Coord, widthM: number, isRightSide: boolean): Feature<Polygon> {
  // 1. Find the compass bearing from A to B
  const bearingAB = turf.bearing(pointA, pointB);

  // 2. Determine the perpendicular bearing (90 degrees offset)
  // If we want it on the right, turn 90 degrees clockwise (+).
  // If left, turn 90 degrees counter-clockwise (-).
  const angleOffset = isRightSide ? 90 : -90;
  const perpendicularBearing = bearingAB + angleOffset;

  // 3. Find Point C (Starting from B, walk the width distance)
  const pointC = turf.destination(pointB, widthM, perpendicularBearing, { units: "meters" });

  // 4. Find Point D (Starting from A, walk the width distance)
  const pointD = turf.destination(pointA, widthM, perpendicularBearing, { units: "meters" });

  // 5. Construct and return the Polygon
  // CRITICAL RULE FOR POLYGONS: The first coordinate and the last coordinate
  // MUST be identical to close the loop! (A -> B -> C -> D -> A)
  return turf.polygon([
    [
      turf.getCoord(pointA),
      turf.getCoord(pointB),
      turf.getCoord(pointC),
      turf.getCoord(pointD),
      turf.getCoord(pointA), // Back to the start
    ],
  ]);
  // Example Usage
  // const A = turf.point([125.0, 6.0]);
  // const B = turf.point([125.01, 6.01]);
  // const width = 2; // 2 kilometers wide
  // const isRight = true;

  // const parcelPolygon = createRectangleFromLine(A, B, width, isRight);
}

export function getPointsAlongSegment(pointA: turf.Coord, pointB: turf.Coord, fractions: number[]): turf.Coord[] {
  const line = turf.lineString([turf.getCoord(pointA), turf.getCoord(pointB)]);
  const totalDistance = turf.length(line, { units: "meters" });

  return fractions.map((fraction) => {
    const distance = totalDistance * Math.max(0, Math.min(1, fraction));
    return turf.getCoord(turf.along(line, distance, { units: "meters" }));
  });
}

/**
 * Generates a specific number of equally spaced points along a segment
 * defined by two points. Includes the start and end points.
 */
export function generateEquallySpacedPoints(pointA: turf.Coord, pointB: turf.Coord, count: number): turf.Coord[] {
  if (count <= 0) return [];
  if (count === 1) return [turf.getCoord(pointA)];

  const line = turf.lineString([turf.getCoord(pointA), turf.getCoord(pointB)]);
  const totalDistance = turf.length(line, { units: "meters" });

  return Array.from({ length: count }, (_, i) => {
    const distance = (totalDistance * i) / (count - 1);
    return turf.getCoord(turf.along(line, distance, { units: "meters" }));
  });
  // Example Usage:
  // const A = turf.point([125.0, 6.0]);
  // const B = turf.point([125.01, 6.01]);
  // const totalPointsToGenerate = 5;
  //
  // const linePoints = generateEquallySpacedPoints(A, B, totalPointsToGenerate);
  // linePoints will contain 5 points: 0%, 25%, 50%, 75%, and 100% along the line.
}
export function flipLatLng([lng, lat]: [number, number]): [number, number] {
  return [lat, lng];
}

export function getBuildingLabelPoint(polygonPoints: [number, number][]): [number, number] {
  // Gotcha 2 Fix: Clone the array to avoid mutating original state,
  // and ensure the first and last coordinates are identical to close the loop.
  const coordinates = [...polygonPoints];

  if (coordinates.length > 0) {
    const firstPoint = coordinates[0];
    const lastPoint = coordinates[coordinates.length - 1];

    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      coordinates.push([firstPoint[0], firstPoint[1]]);
    }
  }

  // Gotcha 1 Fix: Wrap the closed 2D coordinate array inside an extra array layer
  // to satisfy Turf's GeoJSON structure requirement: number[][][] (Outer ring + holes).
  const geoJsonPolygon = turf.polygon([coordinates]);

  // Safely evaluate the layout center
  const labelPointFeature = turf.pointOnFeature(geoJsonPolygon);

  // Return raw [lng, lat] / [x, y] coordinates
  return labelPointFeature.geometry.coordinates as [number, number];
}
