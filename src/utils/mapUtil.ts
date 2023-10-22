import { STACKSTATUS } from "../data/constants";
import type { IBuilding } from "../interfaces/IBuilding";
import type { IMapStatus } from "../interfaces/IMapStatus";
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
  elbiMap.fitBounds(building.polygon, { padding: [50, 50] });
}

export { handleSelectBuilding };
