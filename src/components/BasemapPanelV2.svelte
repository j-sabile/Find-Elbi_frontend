<script lang="ts">
  import { mapSettings } from "../stores/mapV2";
  import { createEventDispatcher } from "svelte";
  import ToolPanelV2 from "./ToolPanelV2.svelte";
  import { basemaps } from "../data/constants";

  const dispatch = createEventDispatcher();
</script>

<ToolPanelV2 title="Basemaps" closeOnOutside on:close={() => dispatch("close")}>
  <span class="text-sm text-gray-500">Select a base layer for the map</span>

  <div class="grid grid-cols-1 gap-3 w-80">
    {#each basemaps as basemap}
      <button
        class="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:bg-gray-50 text-left w-full {$mapSettings.activeBasemap === basemap.tileLayer
          ? 'bg-blue-50 border-blue-300'
          : 'border-gray-200 bg-white'}"
        on:click={() => mapSettings.setBasemap(basemap.tileLayer)}
      >
        <img src={basemap.thumb} alt={basemap.title} class="w-20 h-14 rounded-lg border border-gray-200 object-cover shrink-0" />
        <div class="flex flex-col gap-3 flex-1 min-w-0">
          <span class="text-sm font-medium text-gray-900">{basemap.title}</span>
          <span class="text-sm text-gray-500">{basemap.meta}</span>
        </div>
        {#if $mapSettings.activeBasemap === basemap.tileLayer}
          <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-300 shrink-0">Active</span>
        {/if}
      </button>
    {/each}
  </div>
</ToolPanelV2>
