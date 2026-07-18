<script lang="ts">
  import { type FLOORS, ROOM_TYPES } from "../data/constants";
  import type { IBuilding } from "../interfaces/IBuilding";
  import { navigationStoreV2 } from "../stores/navigationV2";
  import BuildingTypeIconV2 from "./BuildingTypeIconV2.svelte";
  import FloorChips from "./FloorChips.svelte";

  export let building: IBuilding;

  $: activeFloor = building.floors?.find((f) => f.levelIndex === $navigationStoreV2.selectedFloorIndex);

  const selectFloor = (level: number) => {
    navigationStoreV2.selectFloor(level);
  };

  function roomTypeLabel(roomType: ROOM_TYPES | undefined): string {
    return roomType ?? ROOM_TYPES.ACADEMIC;
  }
</script>

{#if building.floors && building.floors.length > 0}
  <!-- Horizontal Floor Tabs -->
  <FloorChips floors={building.floors} floorLevelIndex={$navigationStoreV2.selectedFloorIndex} on:select={(e) => selectFloor(e.detail)} />

  <!-- Active Floor's Room List -->
  <div class="flex-1 overflow-y-auto p-3 bg-gray-50 overscroll-contain">
    {#if activeFloor}
      {#if activeFloor.rooms.length === 0}
        <div class="text-center text-sm text-gray-500 py-6">No rooms on this floor.</div>
      {:else}
        <div class="flex flex-col gap-2 pb-6 sm:pb-0">
          {#each activeFloor.rooms as room (room.code)}
            <button
              class="w-full text-left bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all duration-200 hover:border-gray-300 hover:shadow-sm {$navigationStoreV2.selectedRoomId &&
              $navigationStoreV2.selectedRoomId === room.id
                ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/30'
                : ''}"
              on:click={() => navigationStoreV2.selectRoom(room.code)}
            >
              <div class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 shrink-0">
                <BuildingTypeIconV2 type={building.type} />
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
