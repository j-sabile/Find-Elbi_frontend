import { writable, get } from "svelte/store";
import { Map } from "leaflet";

export type BasemapType = "street" | "osm" | "satellite";
export type LatLng = [number, number];

export interface MapState {
  map: Map;
  activeBasemap: BasemapType;
  showCentroids: boolean;
  showBoundaries: boolean;
  showGrid: boolean;
  mouseLatLng: { lat: number; lng: number } | null;
}

function createMapStoreV2() {
  const { subscribe, update } = writable<MapState>({
    map: null as unknown as Map,
    activeBasemap: "satellite",
    showCentroids: false,
    showBoundaries: false,
    showGrid: false,
    mouseLatLng: null,
  });

  return {
    subscribe,
    setMap: (map: Map) => update((s) => ({ ...s, map })),
    setBasemap: (basemap: BasemapType) => update((s) => ({ ...s, activeBasemap: basemap })),
    toggleOverlay: (overlay: "centroids" | "boundaries" | "grid", visible: boolean) =>
      update((s) => {
        if (overlay === "centroids") return { ...s, showCentroids: visible };
        if (overlay === "boundaries") return { ...s, showBoundaries: visible };
        if (overlay === "grid") return { ...s, showGrid: visible };
        return s;
      }),
    setMouseLatLng: (latlng: { lat: number; lng: number } | null) => update((s) => ({ ...s, mouseLatLng: latlng })),
    triggerFitBounds: (points: LatLng[]) => {
      const map = get(mapStoreV2).map;
      if (map && points.length > 0) {
        map.fitBounds(points, { padding: [50, 50], maxZoom: 18 });
      }
    },
  };
}

export const mapStoreV2 = createMapStoreV2();
