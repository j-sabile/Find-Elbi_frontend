<script lang="ts">
  export let classes = "";

  import { mapInstance, mapSettings } from "../stores/mapV2";
  import { gisStoreV2 } from "../stores/gisV2";
  import L, { type TileLayer } from "leaflet";
  import { CAMPUS_BOUNDARY, DEFAULT_MAP_SETTINGS } from "../data/constants";

  // Import our decoupled components
  // import GridOverlay from "./map-tools/GridOverlay.svelte";
  import CentroidOverlay from "./map-tools/CentroidOverlay.svelte";
  import GridOverlay from "./map-tools/GridOverlay.svelte";
  import BufferTool from "./map-tools/BufferTool.svelte";
  import MeasurementTool from "./map-tools/MeasurementTool.svelte";
  import NearestTool from "./map-tools/NearestTool.svelte";
  import BuildingDrawTool from "./map-tools/BuildingDrawTool.svelte";

  // ─── Basemap Management ───
  let currentBasemap: TileLayer | undefined;

  $: if ($mapInstance && $mapSettings.activeBasemap !== currentBasemap) {
    if (currentBasemap) $mapInstance.removeLayer(currentBasemap);
    currentBasemap = $mapSettings.activeBasemap;
    currentBasemap.addTo($mapInstance);
  }

  // ─── Map Initialization ───
  function createMap(container: HTMLElement) {
    const map = L.map(container, {
      zoomControl: false,
      preferCanvas: true,
      maxZoom: DEFAULT_MAP_SETTINGS.maxZoom,
      minZoom: DEFAULT_MAP_SETTINGS.minZoom,
    }).setView(DEFAULT_MAP_SETTINGS.center, DEFAULT_MAP_SETTINGS.initialZoom);

    // Save to store immediately for children to access
    mapInstance.set(map);

    // Base UI
    L.polyline(CAMPUS_BOUNDARY, { color: "#ef4444", weight: 2, dashArray: "8 6", opacity: 0.8 }).bindTooltip("UPLB Campus Boundary", { sticky: true, opacity: 0.8 }).addTo(map);

    L.control.scale({ position: "topright", metric: true, imperial: false }).addTo(map);
    L.control.zoom({ position: "topleft" }).addTo(map);

    // Set initial basemap
    $mapSettings.activeBasemap.addTo(map);

    return {
      destroy() {
        map.off();
        map.remove();
        mapInstance.set(null);
      },
    };
  }

  // Handle cursor style globally based on tool selection
  $: if ($mapInstance) {
    const container = $mapInstance.getContainer();
    container.style.cursor = $gisStoreV2.activeTool !== "none" ? "crosshair" : "";
  }
</script>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<div class="map {classes}" use:createMap>
  {#if $mapInstance}
    {#if $mapSettings.showGrid}
      <GridOverlay />
    {/if}

    {#if $mapSettings.showCentroids}
      <CentroidOverlay />
    {/if}

    {#if $gisStoreV2.activeTool === "buffer"}
      <BufferTool />
    {:else if $gisStoreV2.activeTool === "measure_dist" || $gisStoreV2.activeTool === "measure_area"}
      <MeasurementTool />
    {:else if $gisStoreV2.activeTool === "nearest"}
      <NearestTool />
    {:else if $gisStoreV2.activeTool === "draw_building"}
      <BuildingDrawTool />
    {/if}
  {/if}
</div>

<style>
  .map {
    width: 100vw;
    height: 100vh;
  }
</style>
