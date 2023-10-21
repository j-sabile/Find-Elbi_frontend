<script lang="ts">
  import { slide } from "svelte/transition";
  import { mapStatus } from "../stores/mapStatus";
  import { STACKSTATUS } from "../data/constants";
  import { handleSelectBuilding } from "../utils/mapUtil";

  export let classes = "";
  let pillExtended = false;
</script>

{#if $mapStatus.status !== STACKSTATUS.HOME}
  <div class="flex flex-col absolute bg-white w-full box-border rounded-t-2xl bottompane {pillExtended ? 'extended' : 'semi-extended'} {classes}" transition:slide>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="w-full bg-white rounded-t-2xl flex justify-center cursor-pointer" on:click={() => (pillExtended = !pillExtended)}>
      <div class="pill bg-neutral-300 rounded-full shadow-sm m-2" />
    </div>
    <div class="w-full overflow-auto px-3">
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
        <div class="text-2xl">{$mapStatus.selectedBuilding?.name}</div>
        <div class="text-sm">{$mapStatus.selectedBuilding?.type}</div>
        <div class="text-sm">{$mapStatus.selectedBuilding?.address}, Batong Malake, Los Banos</div>
      {/if}
    </div>
  </div>
{/if}

<style>
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
