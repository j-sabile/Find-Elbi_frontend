import type { ROOM_TYPES } from "../data/constants";

export interface IRoom {
  id: string;
  name: string;
  code: string;
  alternateNames: string[];
  polygon: [number, number][];
  roomType: ROOM_TYPES;
}
