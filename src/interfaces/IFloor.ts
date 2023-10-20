import { FLOORS } from "../data/constants";
import type { IRoom } from "./IRoom";

export interface IFloor {
  level: FLOORS;
  rooms: IRoom[];
}
