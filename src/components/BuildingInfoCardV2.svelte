<script lang="ts">
  import { mapStatus } from "../stores/mapStatus";
  import type { IBuilding } from "../interfaces/IBuilding";
  import type { IFloor } from "../interfaces/IFloor";
  import { handleUnselect, handleSelectFloor, handleClearFloorOverlay } from "../utils/mapUtil";
  import BuildingTypeIconV2 from "./BuildingTypeIconV2.svelte";
  import { ROOM_TYPES } from "../data/constants";
  import { X, ChevronDown } from "lucide-svelte";
  import { fly, slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  export let building: IBuilding;

  // Count total rooms across all floors.
  $: totalRooms = (building.floors ?? []).reduce((sum, f) => sum + f.rooms.length, 0);
  $: totalFloors = building.floors?.length ?? 0;

  // Only one floor dropdown open at a time.
  let openFloor: string | null = null;

  function toggleFloor(floor: IFloor) {
    if (openFloor === floor.level) {
      openFloor = null;
      handleClearFloorOverlay();
    } else {
      openFloor = floor.level;
      handleSelectFloor(floor);
    }
  }

  function roomTypeLabel(roomType: ROOM_TYPES | undefined): string {
    return roomType ?? ROOM_TYPES.ACADEMIC;
  }
</script>

<div class="absolute bottom-4 left-4 z-20 flex flex-col gap-3 pointer-events-auto w-[26rem] max-w-[calc(100vw-2rem)]" transition:fly={{ y: 50, duration: 300, easing: cubicOut }}>
  <!-- Building info card (CARD) -->
  <div class="bg-white border border-gray-200 rounded-xl shadow-lg p-5 flex flex-col gap-3">
    <!-- Header row: name + close -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white shrink-0">
          <BuildingTypeIconV2 type={building.type} kind="building" />
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-gray-900 truncate">{building.name}</h2>
      </div>
      <button
        class="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200 shrink-0"
        title="Close"
        on:click={handleUnselect}
      >
        <X class="w-5 h-5 shrink-0 text-gray-700" strokeWidth={2} />
      </button>
    </div>

    <!-- Subtext: type · floors · rooms -->
    <div class="flex items-center gap-3 text-sm text-gray-500">
      <span class="font-medium text-gray-700">{building.type}</span>
      <span class="text-gray-300">·</span>
      <span class="font-medium text-gray-700">{totalFloors} floors</span>
      <span class="text-gray-300">·</span>
      <span class="font-medium text-gray-700">{totalRooms} rooms</span>
    </div>
  </div>

  <!-- Floor dropdowns -->
  {#if building.floors && building.floors.length > 0}
    <div class="bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col overflow-hidden">
      <div class="flex flex-col divide-y divide-gray-200">
        {#each building.floors as floor (floor.level)}
          <div class="flex flex-col">
            <!-- Floor header (collapsed dropdown) -->
            <button
              class="flex items-center justify-between gap-3 py-2 px-6 w-full text-left transition-colors duration-200 hover:bg-gray-50 {openFloor === floor.level ? 'bg-blue-50' : ''}"
              on:click={() => toggleFloor(floor)}
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-base font-semibold px-4 py-1 rounded-lg {openFloor === floor.level ? 'bg-blue-600 text-white' : 'bg-gray-300'}">{floor.level}</span>
                <span class="text-sm text-gray-500">{floor.rooms.length} rooms</span>
              </div>
              <ChevronDown class="w-5 h-5 shrink-0 text-gray-500 transition-transform duration-200 {openFloor === floor.level ? 'rotate-180' : ''}" strokeWidth={2} />
            </button>

            <!-- Expanded room list (compact, fixed height, scrollable) -->
            {#if openFloor === floor.level}
              <div class="flex flex-col p-3 bg-gray-50" transition:slide={{ duration: 300 }}>
                {#if floor.rooms.length === 0}
                  <span class="text-sm text-gray-500 px-1 py-2">No rooms on this floor.</span>
                {:else}
                  <div class="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {#each floor.rooms as room (room.code)}
                      <div class="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-3 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm">
                        <div class="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white shrink-0">
                          <BuildingTypeIconV2 type={building.type} kind="room" roomType={room.roomType} />
                        </div>
                        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                          <span class="text-sm text-gray-900 font-semibold truncate leading-tight">{room.code}</span>
                          <span class="text-xs text-gray-500 truncate leading-tight">{room.name}</span>
                        </div>
                        <span class="text-xs text-gray-400 shrink-0 font-medium">{roomTypeLabel(room.roomType)}</span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
