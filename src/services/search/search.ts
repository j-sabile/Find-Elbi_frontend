import type { ISearchResult } from "../../interfaces/ISearchResult";
import { fuse } from "./searchIndex";
import { toSearchResult } from "./searchMapper";

const SCORE_WINDOW = 0.15;

export default function search(query: string): ISearchResult[] {
  const trimmed = query.trim();

  if (!trimmed) return [];

  const hits = fuse.search(trimmed);
  if (!hits.length) return [];
  const bestScore = hits[0].score ?? 0;
  console.log("hits, search", hits);

  return hits.filter((hit) => (hit.score ?? 1) <= bestScore + SCORE_WINDOW).map((hit) => toSearchResult(hit.item));
}
