// import Fuse from "fuse.js";
// import buildings from "../data/buildings";
// import type { IBuilding } from "../interfaces/IBuilding";
// import type { ISearchResult } from "../interfaces/ISearchResult";
// import { TYPES, ROOM_TYPES } from "../data/constants";

// const THRESHOLD = 0.3;

// interface RoomFuse {
//   kind: "room";
//   name: string;
//   code: string;
//   alternateNames: string[];
//   type: ROOM_TYPES;
//   floorLevelIndex: number;
//   building: BuildingFuse;
// }

// interface BuildingFuse {
//   kind: "building";
//   name: string;
//   alternateNames: string[];
//   type: TYPES;
// }

// function flattenRoomsList(buildingsList: IBuilding[]): RoomFuse[] {
//   const rooms: RoomFuse[] = [];
//   for (const building of buildingsList) {
//     const buildingFuse: BuildingFuse = {
//       kind: "building",
//       name: building.name,
//       alternateNames: building.alternateNames,
//       type: building.type,
//     };
//     if (!building.floors) continue;
//     for (const floor of building.floors) {
//       for (const room of floor.rooms) {
//         rooms.push({
//           kind: "room",
//           name: room.name,
//           code: room.code,
//           alternateNames: room.alternateNames,
//           type: room.roomType,
//           floorLevelIndex: floor.levelIndex,
//           building: buildingFuse,
//         });
//       }
//     }
//   }
//   return rooms;
// }

// function buildingToResult(b: BuildingFuse): ISearchResult {
//   return {
//     kind: b.kind,
//     id: `${b.kind} ${b.name}`,
//     name: b.name,
//     subtext: "",
//     buildingType: b.type,
//   };
// }

// function roomToResult(r: RoomFuse): ISearchResult {
//   return {
//     kind: "room",
//     id: `${r.kind} ${r.code}`,
//     name: r.name,
//     subtext: "",
//     buildingType: r.building.type,
//     roomType: r.type,
//     building: buildingToResult(r.building),
//     floorLevelIndex: r.floorLevelIndex,
//   };
// }

// function topResults<T extends { score?: number }>(results: T[], toResult: (item: T) => ISearchResult): ISearchResult[] {
//   if (results.length === 0) return [];
//   const base = results[0].score!;
//   const out: ISearchResult[] = [];
//   for (const r of results) {
//     if (r.score! > base + THRESHOLD) break;
//     out.push(toResult(r));
//   }
//   return out;
// }

// export function searchV2(input: string, buildingsList: IBuilding[] = buildings): ISearchResult[] {
//   const trimmed = input.trim();
//   if (trimmed.length === 0) return [];

//   const buildingIndex = new Fuse(buildingsList, {
//     keys: [
//       { name: "name", weight: 0.4 },
//       { name: "alternateNames", weight: 0.4 },
//       { name: "type", weight: 0.2 },
//     ],
//     includeScore: true,
//     threshold: 0.3,
//   });

//   const roomIndex = new Fuse(flattenRoomsList(buildingsList), {
//     keys: [
//       { name: "name", weight: 0.5 },
//       { name: "alternateNames", weight: 0.1 },
//       { name: "roomType", weight: 0.2 },
//       { name: "building.name", weight: 0.2 },
//     ],
//     includeScore: true,
//     threshold: 0.3,
//   });

//   const buildingHits = buildingIndex.search(trimmed);
//   const roomHits = roomIndex.search(trimmed);

//   const buildingResults = topResults(buildingHits, (h) => buildingToResult(h.item as IBuilding));
//   const roomResults = topResults(roomHits, (h) => roomToResult(h.item as RoomFuse));

//   return [...roomResults, ...buildingResults];
// }

// export default searchV2;
