import { type College, type BuildingType, type IFloor, BUILDING_TYPES } from "../data/constants";

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
  type: Exclude<BuildingType, typeof BUILDING_TYPES.ACADEMIC>;
}

export interface IAcadBuilding extends IBaseBuilding {
  type: typeof BUILDING_TYPES.ACADEMIC;
  college: College;
}

export type Section = {
  id: string;
  polygon: [number, number][];
};

export type IBuilding = IRegBuilding | IAcadBuilding;
