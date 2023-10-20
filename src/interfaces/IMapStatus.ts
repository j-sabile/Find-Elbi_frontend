import { STACKSTATUS } from "../data/constants";

export interface IMapStatus {
  status: STACKSTATUS;
  searchInput: string;
}

export const mapStatusDefault: IMapStatus = {
  status: STACKSTATUS.HOME,
  searchInput: "",
};
