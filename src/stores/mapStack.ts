import { writable } from "svelte/store";
import { STACKSTATUS } from "../data/constants";
import type { IMapStatus } from "../interfaces/IMapStatus";
import { mapStatusDefault } from "../interfaces/IMapStatus";

function createStore() {
  const { subscribe, set, update } = writable<IMapStatus[]>([]);

  function pushMapStatus(mapStatus: IMapStatus) {
    update((arr) => {
      if (mapStatus.status === STACKSTATUS.HOME) return [mapStatusDefault];
      else if (mapStatus.status === STACKSTATUS.SEARCH) return [mapStatusDefault, mapStatus];
      else if (mapStatus.status === STACKSTATUS.BUILDING) {
        if (arr[arr.length - 1].status === STACKSTATUS.BUILDING) {
          arr[arr.length - 1] = mapStatus;
          return arr;
        } else return [...arr, mapStatus];
      } else return arr;
    });
  }

  function popMapStatus() {
    let poppedMapStatus: IMapStatus | undefined;
    update((arr) => {
      poppedMapStatus = arr.pop() || mapStatusDefault;
      return arr;
    });
    return poppedMapStatus as IMapStatus;
  }

  return {
    subscribe,
    pushMapStatus,
    popMapStatus,
  };
}

export const mapStack = createStore();
