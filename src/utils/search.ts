import Fuse from "fuse.js";
import buildings from "../data/buildings";
import type { IBuilding } from "../interfaces/IBuilding";

const THRESHOLD = 0.3;

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
  if (temp.length > 0) {
    let newTemp = [];
    for (let i = 0; i < temp.length; i++) {
      if (temp[i].score! > temp[0].score! + THRESHOLD) return newTemp;
      newTemp.push(temp[i].item);
    }
  }
  return temp.map((i) => i.item) as IBuilding[];
};

export default search;
