import { Marker } from "leaflet";
import { STACKSTATUS } from "../data/constants";
import type { IBuilding } from "./IBuilding";

export interface IMapStatus {
  status: STACKSTATUS;
  searchInput: string;
  searchResults: IBuilding[];
  markers: Marker[];
}

export const mapStatusDefault: IMapStatus = {
  status: STACKSTATUS.HOME,
  searchInput: "",
  searchResults: [],
  markers: [],
};
