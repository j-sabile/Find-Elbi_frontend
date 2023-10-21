import { writable } from "svelte/store";
import { STACKSTATUS } from "../data/constants";
import type { IBuilding } from "../interfaces/IBuilding";
import type { IMapStatus } from "../interfaces/IMapStatus";
import { mapStatusDefault } from "../interfaces/IMapStatus";
import { Marker, Polygon } from "leaflet";

function createStore() {
  const { subscribe, set, update } = writable<IMapStatus>({ ...mapStatusDefault });

  return {
    subscribe,
    set: (mapStatus: IMapStatus) => set(mapStatus),
    setSearchInput: (searchInput: string) => update((i) => ({ ...i, searchInput })),
    setStatus: (status: STACKSTATUS) => update((i) => ({ ...i, status })),
    setSearchResults: (searchResults: IBuilding[]) => update((i) => ({ ...i, searchResults })),
    setMarkers: (markers: Marker[]) => update((i) => ({ ...i, markers })),
    setPolygons: (polygons: Polygon[]) => update((i) => ({ ...i, polygons })),
    reset: () => set(mapStatusDefault),
  };
}

export const mapStatus = createStore();
