<script lang="ts">
  import { Plus, Trash2 } from "lucide-svelte";
  import type { IFloor } from "../../data/constants";

  // Note: Import your actual IFloor and IRoom types here if needed

  // 1. `export let` exposes this variable to the parent component.
  // 2. We provide a default initial state in case the parent passes undefined.
  export let floors: IFloor[];

  // Reactively sort the floors whenever the array changes
  $: sortedFloors = [...floors].sort((a, b) => b.levelIndex - a.levelIndex);

  function addFloorAbove() {
    const highestLevel = floors.length > 0 ? Math.max(...floors.map((f) => f.levelIndex)) : -1;
    const newLevel = highestLevel + 1;

    // Reassigning `floors` automatically updates the bound parent variable
    floors = [...floors, { levelIndex: newLevel, label: `Level ${newLevel}`, rooms: [] }];
  }

  function addBasementBelow() {
    const lowestLevel = floors.length > 0 ? Math.min(...floors.map((f) => f.levelIndex)) : 1;
    const newLevel = lowestLevel - 1;

    floors = [...floors, { levelIndex: newLevel, label: `Basement ${Math.abs(newLevel)}`, rooms: [] }];
  }

  function removeFloor(levelIndex: number) {
    if (floors.length <= 1) return; // Prevent deleting the last remaining floor
    floors = floors.filter((f) => f.levelIndex !== levelIndex);
  }
</script>

<div class="flex flex-col gap-4 w-full max-w-sm bg-gray-50 p-4 rounded-xl border border-gray-200">
  <div class="flex flex-col gap-1">
    <h3 class="text-sm font-semibold text-gray-800">Building Floors</h3>
    <p class="text-[11px] text-gray-500">Define the vertical structure of the building.</p>
  </div>

  <!-- Add Above Button -->
  <button
    class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-xs font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
    on:click={addFloorAbove}
  >
    <Plus class="w-4 h-4" /> Add Floor Above
  </button>

  <!-- The Stack -->
  <div class="flex flex-col gap-2">
    {#each sortedFloors as floor (floor.levelIndex)}
      <div class="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-lg shadow-sm group">
        <!-- Floor Number Indicator -->
        <div class="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
          {floor.levelIndex > 0 ? `+${floor.levelIndex}` : floor.levelIndex}
        </div>

        <!-- Editable Label Input (bind:value updates the object inside the array instantly) -->
        <input
          type="text"
          bind:value={floor.label}
          class="flex-1 text-sm border-none outline-none focus:ring-2 focus:ring-blue-100 rounded px-2 py-1 bg-transparent hover:bg-gray-50 transition-colors"
          placeholder="Floor name..."
        />

        <!-- Delete Button -->
        <button
          class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
          on:click={() => removeFloor(floor.levelIndex)}
          disabled={floors.length <= 1}
          title="Remove floor"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    {/each}
  </div>

  <!-- Add Below Button -->
  <button
    class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
    on:click={addBasementBelow}
  >
    <Plus class="w-4 h-4" /> Add Basement Below
  </button>
</div>
