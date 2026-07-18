<script lang="ts">
  import { activeSelectionStore, navigationStoreV2 } from "../stores/navigationV2";
  import type { IBuilding } from "../interfaces/IBuilding";
  import BuildingTypeIconV2 from "./BuildingTypeIconV2.svelte";
  import { FLOORS, RoomType } from "../data/constants";
  import { X } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import FloorDropdowns from "./FloorDropdowns.svelte";
  import { drawBuildingStore } from "../stores/drawBuilding";

  $: building = $activeSelectionStore.building;

  // Count total rooms across all floors.
  $: totalRooms = (building?.floors ?? []).reduce((sum, f) => sum + f.rooms.length, 0);
  $: totalFloors = building?.floors?.length ?? 0;

  // Default to the first floor if none is selected, ensuring the room list is never empty
  // $: openFloorLevel = $navigationStoreV2.selectedFloor?.level ?? (building.floors && building.floors.length > 0 ? building.floors[0].level : null);

  // $: activeFloor = building.floors?.find((f) => f.level === openFloorLevel);

  function selectFloor(floorLevelIndex: number) {
    navigationStoreV2.selectFloor(floorLevelIndex);
  }

  function roomTypeLabel(roomType: RoomType | undefined): string {
    return roomType ?? RoomType.ACADEMIC;
  }
</script>

{#if building}
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
            <BuildingTypeIconV2 type={building.type} />
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

    <FloorDropdowns {building} />
  </div>
{/if}

<style>
</style>
