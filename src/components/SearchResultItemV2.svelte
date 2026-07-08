<script lang="ts">
  import type { ISearchResult } from "../interfaces/ISearchResult";
  import BuildingTypeIconV2 from "./BuildingTypeIconV2.svelte";

  export let result: ISearchResult;
  export let active = false;
</script>

<button
  class="flex items-center justify-between gap-3 p-4 w-full text-left transition-colors duration-200 hover:bg-gray-50 {active
    ? 'bg-blue-50 border-l-2 border-blue-300'
    : ''}"
  on:click
>
  <div class="flex items-center gap-3 min-w-0">
    <div
      class="flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 bg-white shrink-0"
    >
      <BuildingTypeIconV2 type={result.type} kind={result.kind} roomType={result.roomType} />
    </div>
    <div class="flex flex-col gap-0.5 min-w-0">
      <span class="text-base text-gray-900 font-medium truncate">{result.name}</span>
      <span class="text-sm text-gray-500 truncate">{result.subtext}</span>
    </div>
  </div>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 border border-blue-300 text-blue-600 shrink-0"
  >
    {result.kind === "room" ? "Room" : "Building"}
  </span>
</button>