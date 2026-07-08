import type { IBuilding } from "./IBuilding";
import type { TYPES, ROOM_TYPES } from "../data/constants";

export type SearchResultKind = "building" | "room";

export interface ISearchResult {
  kind: SearchResultKind;
  id: string;
  name: string;
  subtext: string;
  type: TYPES;
  roomType?: ROOM_TYPES;
  building?: IBuilding;
  floorLevel?: string;
}
