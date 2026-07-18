<script lang="ts">
  import { RoomType } from "../../data/constants";
  import { drawBuildingStore, selectedSection } from "../../stores/drawBuilding";
  import { get } from "svelte/store";
  import FloorChips from "../FloorChips.svelte";

  // Props passed down from SpatialAdder
  export let polygonPoints: [number, number][];

  // Local Form State
  let roomCode = "";
  let roomName = "";
  let roomType = RoomType.ACADEMIC;
  let roomAlternateNamesStr = "";
  let floorLevelIndex: number | null;

  // Reactivity
  $: roomAlternateNames = roomAlternateNamesStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  $: codeBlock = generateRoomCodeBlock(roomCode, roomName, roomType, roomAlternateNames, polygonPoints);

  function generateRoomCodeBlock(codeVal: string, nameVal: string, typeVal: RoomType, altNamesVal: string[], polygonPtsVal: [number, number][]): string {
    const formattedAlts = altNamesVal.length > 0 ? `[${altNamesVal.map((n) => `"${n}"`).join(", ")}]` : "[]";
    const formattedPolygon = polygonPtsVal.length > 0 ? `[\n${polygonPtsVal.map((p) => `      [${p[0]},${p[1]}]`).join(",\n")}\n    ]` : "[]";

    return `  {
    code: "${codeVal || "UNKNOWN-CODE"}",
    name: "${nameVal || "Unnamed Room"}",
    roomType: RoomType.${Object.keys(RoomType).find((k) => RoomType[k as keyof typeof RoomType] === typeVal) || "ACADEMIC"},
    alternateNames: ${formattedAlts},
    polygon: ${formattedPolygon},
  },`;
  }

  function handleSave() {
    if (floorLevelIndex === null) return;
    console.log(`calling drawBuildingStore.updateBuilding()`);
    const currentSection = get(selectedSection);
    if (currentSection === null) return;
    console.log(
      {
        name: roomName,
        code: roomCode,
        alternateNames: roomAlternateNames,
        polygon: currentSection.polygon,
        roomType: roomType,
      },
      floorLevelIndex,
    );

    drawBuildingStore.addRoom(
      {
        name: roomName,
        code: roomCode,
        alternateNames: roomAlternateNames,
        polygon: currentSection.polygon,
        roomType: roomType,
      },
      floorLevelIndex,
    );
  }
</script>

<div class="flex flex-col gap-3">
  <label for="room-code" class="text-xs text-gray-500 font-medium">Room Code</label>
  <input
    id="room-code"
    type="text"
    class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-600"
    placeholder="e.g. CAS-101"
    bind:value={roomCode}
  />

  <label for="room-name" class="text-xs text-gray-500 font-medium">Room Name</label>
  <input
    id="room-name"
    type="text"
    class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
    placeholder="e.g. Main Laboratory"
    bind:value={roomName}
  />

  <label for="room-type" class="text-xs text-gray-500 font-medium">Room Type</label>
  <select
    id="room-type"
    class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-900"
    bind:value={roomType}
  >
    {#each Object.values(RoomType) as rt}
      <option value={rt}>{rt}</option>
    {/each}
  </select>

  <label for="room-alts" class="text-xs text-gray-500 font-medium">Alternate Names (Comma-separated)</label>
  <input
    id="room-alts"
    type="text"
    class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
    placeholder="e.g. Comp Lab 1"
    bind:value={roomAlternateNamesStr}
  />

  <hr class="mt-2" />
  <div class="flex flex-col gap-1 w-full">
    <!-- Header Section -->
    <div>
      <h3 class="text-sm font-semibold text-gray-800">Select Floor</h3>
      <p class="text-xs text-gray-500 mb-1">Choose a floor level to add the room.</p>
    </div>

    {#if $drawBuildingStore?.building?.floors && $drawBuildingStore.building.floors.length > 0}
      <FloorChips floors={$drawBuildingStore.building.floors} bind:floorLevelIndex />
    {:else}
      <div class="my-2 p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-center">
        <span class="text-sm font-medium text-gray-500">No floors available</span>
        <span class="text-xs text-gray-400 mt-0.5">Use the floor manager to add levels.</span>
      </div>
    {/if}
  </div>
  <div class="grid gap-3 grid-cols-2">
    <button
      class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-blue-700 disabled:opacity-50"
      disabled={polygonPoints.length < 3 || $drawBuildingStore.building === null}
      on:click={handleSave}
    >
      Save Room
    </button>
  </div>
</div>
