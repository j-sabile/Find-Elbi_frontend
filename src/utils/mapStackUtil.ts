import { Map } from "leaflet";
import { STACKSTATUS } from "../data/constants";
import type { IMapStatus } from "../interfaces/IMapStatus";
import { elbiMap as storeElbiMap } from "../stores/map";
import { mapStack as storeMapStack } from "../stores/mapStack";
import { mapStatus as storeMapStatus } from "../stores/mapStatus";

let mapStack: IMapStatus[], mapStatus: IMapStatus, elbiMap: Map;
storeMapStack.subscribe((i) => (mapStack = i));
storeMapStatus.subscribe((i) => (mapStatus = i));
storeElbiMap.subscribe((i) => (elbiMap = i));

function pop() {
  clearMapElements();
  let temp = storeMapStack.popMapStatus();
  storeMapStatus.set(temp);
  temp.markers.forEach((marker) => marker.addTo(elbiMap));
  temp.polygons.forEach((polygon) => polygon.addTo(elbiMap));
  if (temp.status === STACKSTATUS.SEARCH) {
    elbiMap.fitBounds(
      temp.searchResults.map((i) => i.marker),
      { padding: [50, 50] }
    );
  }
  return temp;
}

function push(i: IMapStatus) {
  console.log(i);
  clearMapElements();
  storeMapStack.pushMapStatus(i);
  storeMapStatus.reset();
}

function clearMapElements() {
  mapStatus.markers.forEach((marker) => marker.removeFrom(elbiMap));
  mapStatus.polygons.forEach((polygon) => polygon.removeFrom(elbiMap));
}

function log() {
  console.log("mapStack:", mapStack);
  console.log("mapStatus:", mapStatus);
}

export { push, pop, log };
