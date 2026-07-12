import { writable, get } from "svelte/store";
import { TYPES } from "../data/constants";
import type { IBuilding } from "../interfaces/IBuilding";
import { dataStoreV2 } from "./dataV2";
import { getHaversineDistance, findNearestBuilding } from "../utils/gisConvert";

export type LatLng = [number, number];
export type BasemapType = "street" | "osm" | "satellite";
export type GisToolType = "none" | "buffer" | "nearest" | "measure_dist" | "measure_area" | "draw_building";

export interface GisState {
  activeTool: GisToolType;
  bufferRadius: number;
  nearestTargetType: TYPES | null;
  draftPoints: LatLng[];
  measurementResult: { distance?: number; area?: number } | null;
  bufferResults: { buildingId: string; distance: number }[];
  nearestResult: { buildingId: string; distance: number; walkingTimeMin: number } | null;
}

const defaultState: GisState = {
  activeTool: "none",
  bufferRadius: 100,
  nearestTargetType: TYPES.ACADEMIC,
  draftPoints: [],
  measurementResult: null,
  bufferResults: [],
  nearestResult: null,
};

function getCentroid(pts: LatLng[]): LatLng {
  if (pts.length === 0) return [0, 0];
  let latSum = 0;
  let lngSum = 0;
  pts.forEach(([lat, lng]) => {
    latSum += lat;
    lngSum += lng;
  });
  return [parseFloat((latSum / pts.length).toFixed(6)), parseFloat((lngSum / pts.length).toFixed(6))];
}

function createGisStoreV2() {
  const { subscribe, set, update } = writable<GisState>({ ...defaultState });

  return {
    subscribe,
    setActiveTool: (tool: GisToolType) =>
      update((s) => ({
        ...s,
        activeTool: tool,
        draftPoints: [],
        measurementResult: null,
        bufferResults: [],
        nearestResult: null,
      })),
    setBufferRadius: (radius: number) => update((s) => ({ ...s, bufferRadius: radius })),
    setNearestTargetType: (type: TYPES | null) => update((s) => ({ ...s, nearestTargetType: type })),
    addPoint: (point: LatLng) =>
      update((s) => ({
        ...s,
        draftPoints: [...s.draftPoints, point],
      })),
    movePoint: (index: number, newPoint: LatLng) =>
      update((s) => {
        const nextPoints = [...s.draftPoints];
        if (index >= 0 && index < nextPoints.length) {
          nextPoints[index] = newPoint;
        }
        return { ...s, draftPoints: nextPoints };
      }),
    undoLastPoint: () =>
      update((s) => ({
        ...s,
        draftPoints: s.draftPoints.slice(0, -1),
      })),
    clearDraft: () =>
      update((s) => ({
        ...s,
        draftPoints: [],
        measurementResult: null,
      })),
    setMeasurementResult: (res: { distance?: number; area?: number } | null) =>
      update((s) => ({
        ...s,
        measurementResult: res,
      })),
    executeBufferQuery: (center: LatLng) =>
      update((s) => {
        const buildingsList = get(dataStoreV2).buildings;
        const results = buildingsList
          .map((b) => ({ buildingId: b.id, distance: getHaversineDistance(center, b.marker) }))
          .filter((r) => r.distance <= s.bufferRadius)
          .sort((a, b) => a.distance - b.distance);

        return {
          ...s,
          bufferResults: results,
        };
      }),
    executeNearestQuery: (origin: LatLng) =>
      update((s) => {
        if (!s.nearestTargetType) return s;
        const buildingsList = get(dataStoreV2).buildings;
        const result = findNearestBuilding(origin, s.nearestTargetType, buildingsList);
        if (!result) return { ...s, nearestResult: null };

        const walkingTimeMin = Math.ceil(result.distance / 1.2 / 60);
        return {
          ...s,
          nearestResult: {
            buildingId: result.building.id,
            distance: result.distance,
            walkingTimeMin,
          },
        };
      }),
    saveDraftBuilding: (metadata: Omit<IBuilding, "polygon" | "marker">) =>
      update((s) => {
        if (s.draftPoints.length < 3) return s;
        const centroid = getCentroid(s.draftPoints);

        const newBuilding: IBuilding = {
          ...metadata,
          marker: centroid,
          polygon: s.draftPoints,
        } as IBuilding;

        dataStoreV2.addBuilding(newBuilding);

        return {
          ...s,
          activeTool: "none",
          draftPoints: [],
          measurementResult: null,
        };
      }),
    reset: () => set({ ...defaultState }),
  };
}

export const gisStoreV2 = createGisStoreV2();
