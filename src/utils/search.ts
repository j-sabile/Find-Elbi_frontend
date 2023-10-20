import Fuse from "fuse.js";
import buildings from "../data/buildings";
import type { IBuilding } from "../interfaces/IBuilding";

const fuse = new Fuse(buildings, {
  keys: [
    { name: "name", weight: 0.4 },
    { name: "alternateNames", weight: 0.4 },
    { name: "type", weight: 0.2 },
  ],
  includeScore: true,
  // threshold: 0.05,
});

const search = (input: string) => {
  let temp = fuse.search(input);
  return temp.map((i) => i.item) as IBuilding[];
};

export default search;
