import { writable } from "svelte/store";
import { STACKSTATUS } from "../data/constants";
import type { IMapStatus } from "../interfaces/IMapStatus";
import { mapStatusDefault } from "../interfaces/IMapStatus";

function createStore() {
  const { subscribe, set, update } = writable<IMapStatus>(mapStatusDefault);

  return {
    subscribe,
    set: (mapStatus: IMapStatus) => set(mapStatus),
    setSearchInput: (searchInput: string) => update((i) => ({ ...i, searchInput })),
    setStatus: (status: STACKSTATUS) => update((i) => ({ ...i, status })),
    reset: () => set(mapStatusDefault),
  };
}

export const mapStatus = createStore();
