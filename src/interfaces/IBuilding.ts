import { COLLEGES, TYPES, type IFloor } from "../data/constants";

interface IBaseBuilding {
  id: string;
  name: string;
  alternateNames: string[];
  address: string;
  marker: [number, number];
  polygon: [number, number][];
  floors?: IFloor[];
  sections: Section[];
}

export interface IRegBuilding extends IBaseBuilding {
  type: Exclude<TYPES, TYPES.ACADEMIC>;
}

export interface IAcadBuilding extends IBaseBuilding {
  type: TYPES.ACADEMIC;
  college: COLLEGES;
}

export type Section = { id: string; polygon: [number, number][] };
export type IBuilding = IRegBuilding | IAcadBuilding;
