import type { RoomType } from "../data/constants";

export interface IRoom {
  id: string;
  name: string;
  code: string;
  alternateNames: string[];
  polygon: [number, number][];
  roomType: RoomType;
}
