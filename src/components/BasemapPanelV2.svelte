<script lang="ts">
  import { gisStore } from "../stores/gis";
  import type { BasemapType } from "../stores/gis";
  import { createEventDispatcher } from "svelte";
  import ToolPanelV2 from "./ToolPanelV2.svelte";

  const dispatch = createEventDispatcher();

  type BasemapMeta = {
    id: BasemapType;
    title: string;
    meta: string;
    thumb: string;
  };

  // Dummy thumbnail placeholders for each basemap.
  const basemaps: BasemapMeta[] = [
    {
      id: "street",
      title: "Street Map",
      meta: "Esri World Street Map",
      thumb: "https://placehold.co/300x180/e2e8f0/64748b?text=Street",
    },
    {
      id: "osm",
      title: "OpenStreetMap",
      meta: "OSM Standard Tiles",
      thumb: "https://placehold.co/300x180/dcfce7/166534?text=OSM",
    },
    {
      id: "satellite",
      title: "Satellite",
      meta: "Esri World Imagery",
      thumb: "https://placehold.co/300x180/1e293b/e2e8f0?text=Satellite",
    },
  ];
</script>

<ToolPanelV2 title="Basemaps" closeOnOutside on:close={() => dispatch("close")}>
  <span class="text-sm text-gray-500">Select a base layer for the map</span>

  <div class="grid grid-cols-1 gap-3 w-80">
    {#each basemaps as basemap}
      <button
        class="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:bg-gray-50 text-left w-full {$gisStore.activeBasemap === basemap.id
          ? 'bg-blue-50 border-blue-300'
          : 'border-gray-200 bg-white'}"
        on:click={() => gisStore.setActiveBasemap(basemap.id)}
      >
        <img src={basemap.thumb} alt={basemap.title} class="w-20 h-14 rounded-lg border border-gray-200 object-cover shrink-0" />
        <div class="flex flex-col gap-3 flex-1 min-w-0">
          <span class="text-sm font-medium text-gray-900">{basemap.title}</span>
          <span class="text-sm text-gray-500">{basemap.meta}</span>
        </div>
        {#if $gisStore.activeBasemap === basemap.id}
          <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-300 shrink-0">Active</span>
        {/if}
      </button>
    {/each}
  </div>
</ToolPanelV2>
