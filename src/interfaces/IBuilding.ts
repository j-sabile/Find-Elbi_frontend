import { COLLEGES, TYPES } from "../data/constants";
import type { IFloor } from "./IFloor";

interface IRegBuilding {
  id: string;
  name: string;
  type: Exclude<TYPES, TYPES.ACADEMIC>;
  alternateNames: string[];
  address: string;
  marker: [number, number];
  polygon: [number, number][];
  floors?: IFloor[];
}

interface IAcadBuilding {
  id: string;
  name: string;
  type: TYPES.ACADEMIC;
  college: COLLEGES;
  alternateNames: string[];
  address: string;
  marker: [number, number];
  polygon: [number, number][];
  floors?: IFloor[];
}

export type IBuilding = IRegBuilding | IAcadBuilding;
