<script lang="ts">
  import { navigationStoreV2 } from "../stores/navigationV2";
  import type { IBuilding } from "../interfaces/IBuilding";
  import type { IFloor } from "../interfaces/IFloor";
  import BuildingTypeIconV2 from "./BuildingTypeIconV2.svelte";
  import { FLOORS, ROOM_TYPES } from "../data/constants";
  import { X } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  export let building: IBuilding;

  // Count total rooms across all floors.
  $: totalRooms = (building.floors ?? []).reduce((sum, f) => sum + f.rooms.length, 0);
  $: totalFloors = building.floors?.length ?? 0;

  // Default to the first floor if none is selected, ensuring the room list is never empty
  $: openFloorLevel = $navigationStoreV2.selectedFloor?.level ?? (building.floors && building.floors.length > 0 ? building.floors[0].level : null);

  $: activeFloor = building.floors?.find((f) => f.level === openFloorLevel);

  function selectFloor(level: FLOORS) {
    navigationStoreV2.selectFloor(level);
  }

  function roomTypeLabel(roomType: ROOM_TYPES | undefined): string {
    return roomType ?? ROOM_TYPES.ACADEMIC;
  }
</script>

<!-- Outer Container: Bottom sheet on mobile, floating card on desktop -->
<div
  class="fixed bottom-0 left-0 w-full sm:absolute sm:bottom-4 sm:left-4 sm:w-[26rem] sm:max-w-[calc(100vw-2rem)] z-20 flex flex-col pointer-events-auto bg-white sm:rounded-2xl rounded-t-3xl border-t sm:border border-gray-200 overflow-hidden max-h-[50vh] h-[500px] h-100 sm:max-h-[80vh]"
  transition:fly={{ y: 100, duration: 300, easing: cubicOut }}
>
  <!-- Mobile Drag Handle Indicator -->
  <div class="w-full flex justify-center pt-3 pb-1 sm:hidden shrink-0">
    <div class="w-10 h-1.5 bg-gray-300 rounded-full"></div>
  </div>

  <!-- Header Section -->
  <div class="px-5 pt-2 sm:pt-5 pb-4 flex flex-col gap-2 shrink-0 border-b border-gray-100">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex items-center justify-center w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 shrink-0">
          <BuildingTypeIconV2 type={building.type} kind="building" />
        </div>
        <div class="flex flex-col">
          <h2 class="text-xl font-bold tracking-tight text-gray-900 truncate">{building.name}</h2>
          <div class="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span class="font-medium">{building.type}</span>
            <span>&bull;</span>
            <span>{totalFloors} floors</span>
            <span>&bull;</span>
            <span>{totalRooms} rooms</span>
          </div>
        </div>
      </div>
      <button
        class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 shrink-0"
        title="Close"
        on:click={navigationStoreV2.closeAndReset}
      >
        <X class="w-4 h-4 shrink-0 text-gray-600" strokeWidth={2.5} />
      </button>
    </div>
  </div>

  {#if building.floors && building.floors.length > 0}
    <!-- Horizontal Floor Tabs -->
    <div class="px-5 py-3 flex gap-2 overflow-x-auto shrink-0 border-b border-gray-100 hide-scrollbar" style="scrollbar-width: none;">
      {#each building.floors as floor (floor.level)}
        <button
          class="px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border {openFloorLevel === floor.level
            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}"
          on:click={() => selectFloor(floor.level)}
        >
          {floor.level}
        </button>
      {/each}
    </div>

    <!-- Active Floor's Room List -->
    <div class="flex-1 overflow-y-auto p-3 bg-gray-50 overscroll-contain">
      {#if activeFloor}
        {#if activeFloor.rooms.length === 0}
          <div class="text-center text-sm text-gray-500 py-6">No rooms on this floor.</div>
        {:else}
          <div class="flex flex-col gap-2 pb-6 sm:pb-0">
            {#each activeFloor.rooms as room (room.code)}
              <button
                class="w-full text-left bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all duration-200 hover:border-gray-300 hover:shadow-sm {$navigationStoreV2.selectedRoom &&
                $navigationStoreV2.selectedRoom.code === room.code
                  ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/30'
                  : ''}"
                on:click={() => navigationStoreV2.selectRoom(room.code)}
              >
                <div class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 shrink-0">
                  <BuildingTypeIconV2 type={building.type} kind="room" roomType={room.roomType} />
                </div>
                <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span class="text-sm text-gray-900 font-bold truncate">{room.code}</span>
                  <span class="text-xs text-gray-500 truncate">{room.name}</span>
                </div>
                <span class="text-[11px] uppercase tracking-wider text-gray-400 shrink-0 font-bold bg-gray-100 px-2 py-1 rounded-md">{roomTypeLabel(room.roomType)}</span>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Optional: Utility to hide scrollbar for webkit browsers in the tabs section */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style>
