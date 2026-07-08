import Fuse from "fuse.js";
import buildings from "../data/buildings";
import type { IBuilding } from "../interfaces/IBuilding";
import type { ISearchResult } from "../interfaces/ISearchResult";
import { TYPES, ROOM_TYPES } from "../data/constants";

const THRESHOLD = 0.3;

interface RoomFlat {
  kind: "room";
  id: string;
  name: string;
  alternateNames: string[];
  type: TYPES;
  building: IBuilding;
  floorLevel: string;
  roomType: ROOM_TYPES;
}

function flattenRooms(): RoomFlat[] {
  const rooms: RoomFlat[] = [];
  for (const building of buildings) {
    if (!building.floors) continue;
    for (const floor of building.floors) {
      for (const room of floor.rooms) {
        rooms.push({
          kind: "room",
          id: `${building.id}-${floor.level}-${room.name}`,
          name: room.name,
          alternateNames: room.alternateNames,
          type: building.type,
          building,
          floorLevel: floor.level,
          roomType: room.roomType,
        });
      }
    }
  }
  return rooms;
}

const buildingIndex = new Fuse(buildings, {
  keys: [
    { name: "name", weight: 0.4 },
    { name: "alternateNames", weight: 0.4 },
    { name: "type", weight: 0.2 },
  ],
  includeScore: true,
  threshold: 0.3,
});

const roomIndex = new Fuse(flattenRooms(), {
  keys: [
    { name: "name", weight: 0.5 },
    { name: "alternateNames", weight: 0.1 },
    { name: "roomType", weight: 0.2 },
    { name: "building.name", weight: 0.2 },
  ],
  includeScore: true,
  threshold: 0.3,
});

function buildingToResult(b: IBuilding): ISearchResult {
  return {
    kind: "building",
    id: b.id,
    name: b.name,
    subtext: b.type,
    type: b.type,
    building: b,
  };
}

function roomToResult(r: RoomFlat): ISearchResult {
  return {
    kind: "room",
    id: r.id,
    name: r.name,
    subtext: `${r.building.name} · ${r.floorLevel}`,
    type: r.type,
    roomType: r.roomType,
    building: r.building,
    floorLevel: r.floorLevel,
  };
}

function topResults<T extends { score?: number }>(results: T[], toResult: (item: T) => ISearchResult): ISearchResult[] {
  if (results.length === 0) return [];
  const base = results[0].score!;
  const out: ISearchResult[] = [];
  for (const r of results) {
    if (r.score! > base + THRESHOLD) break;
    out.push(toResult(r));
  }
  return out;
}

export function searchV2(input: string): ISearchResult[] {
  const trimmed = input.trim();
  if (trimmed.length === 0) return [];

  const buildingHits = buildingIndex.search(trimmed);
  const roomHits = roomIndex.search(trimmed);

  const buildingResults = topResults(buildingHits, (h) => buildingToResult(h.item as IBuilding));
  const roomResults = topResults(roomHits, (h) => roomToResult(h.item as RoomFlat));

  return [...roomResults, ...buildingResults];
}

export default searchV2;
