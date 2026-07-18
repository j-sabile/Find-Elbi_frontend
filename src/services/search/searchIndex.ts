import Fuse from "fuse.js";
import type { SearchDocument, BuildingDocument, RoomDocument } from "./searchTypes";
import type { IBuilding } from "../../interfaces/IBuilding";
import buildings from "../../data/buildings";

function buildDocuments(buildingsList: IBuilding[]): SearchDocument[] {
  const docs: SearchDocument[] = [];

  for (const building of buildingsList) {
    const buildingDoc: BuildingDocument = {
      kind: "building",
      id: building.id,
      name: building.name,
      code: building.name, // TODO: Add building code
      alternateNames: building.alternateNames,
      type: building.type,
    };

    docs.push(buildingDoc);

    if (!building.floors) continue;

    for (const floor of building.floors) {
      for (const room of floor.rooms) {
        const roomDoc: RoomDocument = {
          kind: "room",
          id: room.id,
          name: room.name,
          code: room.code,
          alternateNames: room.alternateNames,
          type: room.roomType,

          floorLevelIndex: floor.levelIndex,
          buildingName: building.name,
          buildingId: building.id,
        };

        docs.push(roomDoc);
      }
    }
  }

  return docs;
}

export const fuse = new Fuse(buildDocuments(buildings), {
  includeScore: true,
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: "name", weight: 0.5 },
    { name: "code", weight: 0.3 },
    { name: "alternateNames", weight: 0.1 },
    { name: "type", weight: 0.1 },
  ],
});
