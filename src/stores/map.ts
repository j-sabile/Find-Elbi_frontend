import { Map } from "leaflet";
import { writable } from "svelte/store";

function createStore() {
  const { subscribe, set, update } = writable<Map>();

  return {
    subscribe,
    set: (map: Map) => set(map),
  };
}

export const elbiMap = createStore();
