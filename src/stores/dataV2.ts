import { writable } from "svelte/store";
import type { IBuilding } from "../interfaces/IBuilding";
import initialBuildings from "../data/buildings";

export interface DataState {
  buildings: IBuilding[];
  isLoaded: boolean;
  error: string | null;
}

function createDataStoreV2() {
  const { subscribe, update } = writable<DataState>({
    buildings: initialBuildings,
    isLoaded: true,
    error: null,
  });

  return {
    subscribe,
    loadBuildings: async () => {
      // Already statically loaded, but keep interface compliance
      return Promise.resolve();
    },
    addBuilding: (building: IBuilding) => {
      update((s) => ({
        ...s,
        buildings: [...s.buildings, building],
      }));
    },
  };
}

export const dataStoreV2 = createDataStoreV2();
