import { STACKSTATUS } from "../data/constants";
import type { IBuilding } from "../interfaces/IBuilding";
import type { IMapStatus } from "../interfaces/IMapStatus";
import type { IFloor } from "../interfaces/IFloor";
import L, { Map } from "leaflet";
import * as mapStackUtil from "./mapStackUtil";

import { mapStatus as storeMapStatus } from "../stores/mapStatus";
import { elbiMap as storeElbiMap } from "../stores/map";

let mapStatus: IMapStatus, elbiMap: Map;
storeMapStatus.subscribe((i) => (mapStatus = i));
storeElbiMap.subscribe((i) => (elbiMap = i));

function handleSelectBuilding(building: IBuilding) {
  mapStackUtil.push(mapStatus, true);
  storeMapStatus.setStatus(STACKSTATUS.BUILDING);
  const polygons = [new L.Polygon(building.polygon).addTo(elbiMap)];
  storeMapStatus.setPolygons(polygons);
  storeMapStatus.setSearchInput(building.name);
  storeMapStatus.setSelectedBuilding(building);
  elbiMap.fitBounds(building.polygon, { padding: [50, 50], maxZoom: 18 });
}

// Show the overlay of a floor's rooms on the map (replaces any current overlay).
function handleSelectFloor(floor: IFloor) {
  if (mapStatus.status !== STACKSTATUS.FLOOR) {
    const temp = mapStatus;
    if (temp.selectedBuilding === undefined) return;
    // Remove the currently tracked building polygon(s) from the map before
    // transitioning, otherwise the reference is lost by reset() and the polygon
    // stays orphaned on the map (never removed on later clears).
    temp.polygons.forEach((p) => p.removeFrom(elbiMap));
    mapStackUtil.push(mapStatus, false);
    storeMapStatus.reset();
    storeMapStatus.setStatus(STACKSTATUS.FLOOR);
    storeMapStatus.setSelectedBuilding(temp.selectedBuilding);
    storeMapStatus.addPolygons(floor.rooms.map((room) => L.polygon(room.polygon, { color: "#028A0F" }).bindTooltip(room.name).addTo(elbiMap)));
    storeMapStatus.setSearchInput(temp.searchInput);
  } else {
    mapStatus.polygons.forEach((room) => room.removeFrom(elbiMap));
    storeMapStatus.addPolygons(floor.rooms.map((room) => L.polygon(room.polygon, { color: "#028A0F" }).bindTooltip(room.name).addTo(elbiMap)));
  }
  storeMapStatus.setSelectedFloor(floor);
}

// Clear the floor room overlay and return to the building view.
function handleClearFloorOverlay() {
  mapStatus.polygons.forEach((p) => p.removeFrom(elbiMap));
  storeMapStatus.setPolygons([]);
  if (mapStatus.status === STACKSTATUS.FLOOR) {
    storeMapStatus.setStatus(STACKSTATUS.BUILDING);
    // Re-add the building polygon so the building outline is shown again
    if (mapStatus.selectedBuilding) {
      const buildingPolygon = new L.Polygon(mapStatus.selectedBuilding.polygon).addTo(elbiMap);
      storeMapStatus.setPolygons([buildingPolygon]);
    }
  }
}

// Unselect the current building/room and return to the home map state.
function handleUnselect() {
  mapStatus.markers.forEach((m) => m.removeFrom(elbiMap));
  mapStatus.polygons.forEach((p) => p.removeFrom(elbiMap));
  storeMapStatus.reset();
}

export { handleSelectBuilding, handleSelectFloor, handleClearFloorOverlay, handleUnselect };
