<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { IFloor } from "../data/constants";

  export let floors: IFloor[] = [];
  export let floorLevelIndex: number | null = null;

  const dispatch = createEventDispatcher<{ select: number }>();
  function handleSelect(index: number) {
    floorLevelIndex = index; // Updates for parents using 'bind:'
    dispatch("select", index); // Emits an event for parents listening with 'on:select'
  }
</script>

<div class="px-5 py-3 flex gap-2 overflow-x-auto shrink-0 border-b border-gray-100 hide-scrollbar" style="scrollbar-width: none;">
  {#each floors as floor (floor.levelIndex)}
    <button
      class="px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border {floorLevelIndex === floor.levelIndex
        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}"
      on:click={() => handleSelect(floor.levelIndex)}
    >
      {floor.label}
    </button>
  {/each}
</div>
