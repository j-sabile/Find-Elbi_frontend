import type { IBuilding } from "../../interfaces/IBuilding";
import type { IRoom } from "../../interfaces/IRoom";

export type SearchFieldDocument = {
  id: string;
  name: string;
  alternateNames: string[];
  code: string;
};

export type BuildingDocument = SearchFieldDocument & {
  kind: "building";
  type: IBuilding["type"];
};

export type RoomDocument = SearchFieldDocument & {
  kind: "room";
  type: IRoom["roomType"];
  floorLevelIndex: number;
  buildingName: string;
  buildingId: string;
};

export type SearchDocument = BuildingDocument | RoomDocument;
