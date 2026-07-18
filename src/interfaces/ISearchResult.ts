import type { BuildingType, RoomType } from "../data/constants";

export type SearchResultKind = "building" | "room";

type BaseSearchResult = {
  buildingId: string;
  alternateNames: string[];
  buildingName: string;
};

export type IBuildingSearchResult = BaseSearchResult & {
  kind: "building";
  buildingType: BuildingType;
  buildingCode: string;
};

export type IRoomSearchResult = BaseSearchResult & {
  kind: "room";
  floorLevelIndex: number;
  roomId: string;
  roomName: string;
  roomCode: string;
  roomType: RoomType;
};

export type ISearchResult = IBuildingSearchResult | IRoomSearchResult;
