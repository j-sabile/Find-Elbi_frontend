import { STACKSTATUS } from "../data/constants";
import type { IBuilding } from "./IBuilding";

export interface IMapStatus {
  status: STACKSTATUS;
  searchInput: string;
  searchResults: IBuilding[];
}

export const mapStatusDefault: IMapStatus = {
  status: STACKSTATUS.HOME,
  searchInput: "",
  searchResults: [],
};
