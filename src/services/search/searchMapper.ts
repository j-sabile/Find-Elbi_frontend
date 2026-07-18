import type { ISearchResult } from "../../interfaces/ISearchResult";
import type { SearchDocument } from "./searchTypes";

export function toSearchResult(doc: SearchDocument): ISearchResult {
  if (doc.kind === "building") {
    return {
      kind: "building",
      buildingId: doc.id,
      buildingName: doc.name,
      buildingType: doc.type,
      buildingCode: doc.name,
      alternateNames: doc.alternateNames,
    };
  }

  return {
    kind: "room",
    buildingId: doc.buildingId,
    buildingName: doc.buildingName,
    alternateNames: doc.alternateNames,
    floorLevelIndex: doc.floorLevelIndex,
    roomCode: doc.code,
    roomId: doc.id,
    roomName: doc.name,
    roomType: doc.type,
  };
}
