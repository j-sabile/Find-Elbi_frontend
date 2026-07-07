import { writable } from "svelte/store";
import type { IBuilding } from "../interfaces/IBuilding";

export type GisToolType = "none" | "buffer" | "nearest" | "measure_dist" | "measure_area";
export type BasemapType = "osm" | "carto" | "satellite" | "topo";

export interface IGisState {
  gisTool: GisToolType;
  mouseLatLng: { lat: number; lng: number } | null;
  activeBasemap: BasemapType;
  overlayCentroids: boolean;
  overlayBoundary: boolean;
  overlayGrid: boolean;
  bufferRadius: number;
  bufferCenter: [number, number] | null;
  bufferResults: { building: IBuilding; distance: number }[];
  nearestTargetType: string;
  nearestOrigin: [number, number] | null;
  nearestResult: { building: IBuilding; distance: number; walkingTimeMin: number } | null;
  measurementPoints: [number, number][];
  measurementResult: { distance?: number; area?: number };
}

const defaultState: IGisState = {
  gisTool: "none",
  mouseLatLng: null,
  activeBasemap: "osm",
  overlayCentroids: false,
  overlayBoundary: false,
  overlayGrid: false,
  bufferRadius: 100,
  bufferCenter: null,
  bufferResults: [],
  nearestTargetType: "Academic Building", // Default target type (from TYPES in constants)
  nearestOrigin: null,
  nearestResult: null,
  measurementPoints: [],
  measurementResult: {},
};

function createGisStore() {
  const { subscribe, set, update } = writable<IGisState>({ ...defaultState });

  return {
    subscribe,
    set,
    update,
    setGisTool: (tool: GisToolType) => update((s) => {
      // Clean up inputs and results when switching tools
      return {
        ...s,
        gisTool: tool,
        bufferCenter: null,
        bufferResults: [],
        nearestOrigin: null,
        nearestResult: null,
        measurementPoints: [],
        measurementResult: {},
      };
    }),
    setMouseLatLng: (coords: { lat: number; lng: number } | null) => update((s) => ({ ...s, mouseLatLng: coords })),
    setActiveBasemap: (basemap: BasemapType) => update((s) => ({ ...s, activeBasemap: basemap })),
    setOverlayCentroids: (val: boolean) => update((s) => ({ ...s, overlayCentroids: val })),
    setOverlayBoundary: (val: boolean) => update((s) => ({ ...s, overlayBoundary: val })),
    setOverlayGrid: (val: boolean) => update((s) => ({ ...s, overlayGrid: val })),
    setBufferRadius: (radius: number) => update((s) => ({ ...s, bufferRadius: radius })),
    setBufferCenter: (center: [number, number] | null) => update((s) => ({ ...s, bufferCenter: center })),
    setBufferResults: (results: { building: IBuilding; distance: number }[]) => update((s) => ({ ...s, bufferResults: results })),
    setNearestTargetType: (type: string) => update((s) => ({ ...s, nearestTargetType: type })),
    setNearestOrigin: (origin: [number, number] | null) => update((s) => ({ ...s, nearestOrigin: origin })),
    setNearestResult: (result: { building: IBuilding; distance: number; walkingTimeMin: number } | null) =>
      update((s) => ({ ...s, nearestResult: result })),
    addMeasurementPoint: (pt: [number, number]) => update((s) => {
      const points = [...s.measurementPoints, pt];
      return { ...s, measurementPoints: points };
    }),
    setMeasurementResult: (res: { distance?: number; area?: number }) => update((s) => ({ ...s, measurementResult: res })),
    clearMeasurements: () => update((s) => ({ ...s, measurementPoints: [], measurementResult: {} })),
    reset: () => set({ ...defaultState }),
  };
}

export const gisStore = createGisStore();
