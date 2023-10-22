import { Marker, Polygon } from "leaflet";
import { FLOORS, STACKSTATUS } from "../data/constants";
import type { IBuilding } from "./IBuilding";
import type { IFloor } from "./IFloor";

export interface IMapStatus {
  status: STACKSTATUS;
  searchInput: string;
  searchResults: IBuilding[];
  markers: Marker[];
  polygons: Polygon[];
  selectedBuilding?: IBuilding;
  selectedFloor?: IFloor;
}

export const mapStatusDefault: IMapStatus = {
  status: STACKSTATUS.HOME,
  searchInput: "",
  searchResults: [],
  markers: [],
  polygons: [],
};
