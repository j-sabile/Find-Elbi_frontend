import { writable } from "svelte/store";
import { STACKSTATUS } from "../data/constants";
import type { IMapStatus } from "../interfaces/IMapStatus";
import { mapStatusDefault } from "../interfaces/IMapStatus";

function createStore() {
  const { subscribe, set, update } = writable<IMapStatus[]>([]);

  function pushMapStatus(mapStatus: IMapStatus) {
    update((arr) => {
      console.log(mapStatus);
      if (mapStatus.status === STACKSTATUS.HOME) {
        return [mapStatus];
      } else if (mapStatus.status === STACKSTATUS.SEARCH) {
        return [mapStatusDefault];
      } else {
        console.log("SPECIAL CASE IN PUSH MAP STATUS");
        return arr;
      }
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
