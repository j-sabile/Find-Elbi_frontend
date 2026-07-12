// stores/map.ts
import type { Map, TileLayer } from "leaflet";
import { writable } from "svelte/store";
import { DEFAULT_BASEMAP } from "../data/constants";

export type BasemapType = "street" | "osm" | "satellite"; // Example types

// --- 1. Heavy State: The Map Instance ---
export const mapInstance = writable<Map | null>(null);

// --- 2. Hyper-active State: Mouse Coordinates ---
export const mouseLatLng = writable<{ lat: number; lng: number } | null>(null);

// --- 3. UI Settings State: The Controls ---
interface MapSettings {
  activeBasemap: TileLayer;
  showCentroids: boolean;
  showBoundaries: boolean;
  showGrid: boolean;
}

function createMapSettings() {
  const { subscribe, set, update } = writable<MapSettings>({ ...defaultMapSettings });

  return {
    subscribe,
    setBasemap: (basemap: TileLayer) => update((s) => ({ ...s, activeBasemap: basemap })),
    toggleCentroids: () => update((s) => ({ ...s, showCentroids: !s.showCentroids })),
    toggleBoundaries: () => update((s) => ({ ...s, showBoundaries: !s.showBoundaries })),
    toggleGrid: () => update((s) => ({ ...s, showGrid: !s.showGrid })),
    reset: () => set({ ...defaultMapSettings }),
  };
}

const defaultMapSettings: MapSettings = {
  activeBasemap: DEFAULT_BASEMAP.tileLayer,
  showCentroids: false,
  showBoundaries: true,
  showGrid: false,
};

export const mapSettings = createMapSettings();
