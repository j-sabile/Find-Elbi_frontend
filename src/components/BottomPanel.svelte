<script lang="ts">
  import { slide } from "svelte/transition";
  import { mapStatus } from "../stores/mapStatus";
  import { FLOORS, STACKSTATUS } from "../data/constants";
  import { handleSelectBuilding } from "../utils/mapUtil";

  export let classes = "";
  let pillExtended = false;

  function handleClickFloor(level: FLOORS) {
    mapStatus.setSelectedFloor(level);
  }
</script>

{#if $mapStatus.status !== STACKSTATUS.HOME}
  <div class="flex flex-col absolute bg-white w-full box-border rounded-t-2xl bottompane {pillExtended ? 'extended' : 'semi-extended'} {classes}" transition:slide>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="w-full bg-white rounded-t-2xl flex justify-center cursor-pointer" on:click={() => (pillExtended = !pillExtended)}>
      <div class="pill bg-neutral-300 rounded-full shadow-sm m-2" />
    </div>
    <div class="w-full overflow-auto px-3 relative">
      {#if $mapStatus.status === STACKSTATUS.SEARCH}
        {#each $mapStatus.searchResults as building, i}
          <div class="py-2 px-2" on:click={() => handleSelectBuilding(building)} role="button" on:keydown={() => {}} tabindex="0">
            <div class="">{building.name}</div>
            <div class="text-xs">{building.type}</div>
          </div>
          {#if i + 1 !== $mapStatus.searchResults.length}
            <hr />
          {/if}
        {/each}
      {:else if $mapStatus.status === STACKSTATUS.BUILDING}
        <div class="relative">
          <div class="text-2xl">{$mapStatus.selectedBuilding?.name}</div>
          <div class="text-sm">{$mapStatus.selectedBuilding?.type}</div>
          <div class="text-sm">{$mapStatus.selectedBuilding?.address}, Batong Malake, Los Banos</div>
        </div>
      {/if}
    </div>
    {#if !pillExtended}
      <div class="floors absolute p-4 flex flex-row gap-3">
        {#if $mapStatus.selectedBuilding?.floors !== undefined}
          {#each $mapStatus.selectedBuilding?.floors as floor}
            <button class="p-2 bg-white floor-btn rounded-full shadow-sm {$mapStatus.selectedFloor === floor.level ? 'selected' : ''}" on:click={() => handleClickFloor(floor.level)}>{floor.level}</button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .selected {
    background-color: #eeeeee;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    transform: scale(1.1);
    transition: transform 0.3s ease;
  }

  .floor-btn {
    height: 40px;
    width: 40px;
  }
  .floors {
    top: -65px;
  }

  .bottompane {
    bottom: 0px;
    height: 0px;
    transition: height 0.3s ease-in-out;
  }

  .pill {
    height: 5px;
    width: 40px;
  }

  .semi-extended {
    height: 150px;
  }
  .extended {
    height: calc(100vh - 60px);
  }
</style>
