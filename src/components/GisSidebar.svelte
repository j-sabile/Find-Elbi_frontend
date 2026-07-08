<script lang="ts">
  import { slide, fade } from "svelte/transition";
  import { gisStore } from "../stores/gis";
  import { mapStatus } from "../stores/mapStatus";
  import { TYPES } from "../data/constants";
  import { handleSelectBuilding } from "../utils/mapUtil";
  import { calculatePolygonArea, calculatePolygonPerimeter, toWKT, toGeoJSON } from "../utils/gisConvert";

  let isExpanded = true;
  let activeTab: "layers" | "proximity" | "measure" | "attributes" = "layers";
  export const _unused = undefined; // external reference only

  const categories = Object.values(TYPES);

  // Copy status indicators
  let copyWktStatus = "Copy WKT";
  let copyGeoJsonStatus = "Copy GeoJSON";

  function copyToClipboard(text: string, type: "wkt" | "geojson") {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "wkt") {
        copyWktStatus = "Copied!";
        setTimeout(() => (copyWktStatus = "Copy WKT"), 2000);
      } else {
        copyGeoJsonStatus = "Copied!";
        setTimeout(() => (copyGeoJsonStatus = "Copy GeoJSON"), 2000);
      }
    });
  }

  // Reactive attributes for selected building
  $: selectedBuilding = $mapStatus.selectedBuilding;
  $: area = selectedBuilding ? calculatePolygonArea(selectedBuilding.polygon) : 0;
  $: perimeter = selectedBuilding ? calculatePolygonPerimeter(selectedBuilding.polygon) : 0;
  $: wkt = selectedBuilding ? toWKT(selectedBuilding.polygon) : "";
  $: geojson = selectedBuilding ? toGeoJSON(selectedBuilding) : "";

  $: centroid = selectedBuilding
    ? (() => {
        let latSum = 0,
          lngSum = 0;
        selectedBuilding.polygon.forEach(([lat, lng]) => {
          latSum += lat;
          lngSum += lng;
        });
        return {
          lat: latSum / selectedBuilding.polygon.length,
          lng: lngSum / selectedBuilding.polygon.length,
        };
      })()
    : null;

  $: bbox = selectedBuilding
    ? (() => {
        let minLat = Infinity,
          maxLat = -Infinity,
          minLng = Infinity,
          maxLng = -Infinity;
        selectedBuilding.polygon.forEach(([lat, lng]) => {
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        });
        return { minLat, maxLat, minLng, maxLng };
      })()
    : null;

  function toggleExpand() {
    isExpanded = !isExpanded;
  }
</script>

<!-- Floating GIS Workspace Container -->
<div class="absolute top-4 right-4 z-[1000] flex flex-col pointer-events-auto h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] select-none">
  {#if !isExpanded}
    <!-- Collapsed Toggle Button -->
    <button
      class="bg-slate-900 border border-slate-800 text-white rounded-lg shadow-2xl p-3 flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-105"
      on:click={toggleExpand}
      title="Open GIS Workspace"
    >
      <svg class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    </button>
  {:else}
    <!-- Expanded Floating Panel -->
    <div class="w-80 md:w-96 bg-slate-950/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-lg flex flex-col h-full overflow-hidden text-slate-200">
      <!-- Panel Header -->
      <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <div>
            <h1 class="text-xs font-bold uppercase tracking-wider text-slate-100">Find-Elbi Spatial GIS</h1>
            <p class="text-[9px] text-slate-400">Developer Analysis Portal</p>
          </div>
        </div>
        <button class="text-slate-400 hover:text-white transition-colors" on:click={toggleExpand}>
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tab Selection -->
      <div class="flex bg-slate-900/50 border-b border-slate-800/80 text-[10px] uppercase font-bold tracking-wider">
        <button
          class="flex-1 py-2 text-center border-b-2 hover:bg-slate-900/30 transition-all {activeTab === 'layers'
            ? 'border-emerald-500 text-emerald-400 bg-slate-950/20'
            : 'border-transparent text-slate-400'}"
          on:click={() => (activeTab = "layers")}
        >
          Layers
        </button>
        <button
          class="flex-1 py-2 text-center border-b-2 hover:bg-slate-900/30 transition-all {activeTab === 'proximity'
            ? 'border-emerald-500 text-emerald-400 bg-slate-950/20'
            : 'border-transparent text-slate-400'}"
          on:click={() => (activeTab = "proximity")}
        >
          Queries
        </button>
        <button
          class="flex-1 py-2 text-center border-b-2 hover:bg-slate-900/30 transition-all {activeTab === 'measure'
            ? 'border-emerald-500 text-emerald-400 bg-slate-950/20'
            : 'border-transparent text-slate-400'}"
          on:click={() => (activeTab = "measure")}
        >
          Measure
        </button>
        <button
          class="flex-1 py-2 text-center border-b-2 hover:bg-slate-900/30 transition-all {activeTab === 'attributes'
            ? 'border-emerald-500 text-emerald-400 bg-slate-950/20'
            : 'border-transparent text-slate-400'}"
          on:click={() => (activeTab = "attributes")}
        >
          Attributes
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="flex-grow overflow-y-auto p-4 space-y-4 text-xs">
        <!-- 1. LAYERS TAB -->
        {#if activeTab === "layers"}
          <div transition:fade={{ duration: 150 }} class="space-y-4">
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">GIS Basemaps</span>
              <div class="grid grid-cols-2 gap-2">
                <button
                  class="p-2 rounded border text-left flex flex-col gap-1 transition-all {$gisStore.activeBasemap === 'osm'
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'}"
                  on:click={() => gisStore.setActiveBasemap("osm")}
                >
                  <span class="font-bold text-xs">Standard Streets</span>
                  <span class="text-[9px] text-slate-400">OpenStreetMap</span>
                </button>
                <button
                  class="p-2 rounded border text-left flex flex-col gap-1 transition-all {$gisStore.activeBasemap === 'street'
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'}"
                  on:click={() => gisStore.setActiveBasemap("street")}
                >
                  <span class="font-bold text-xs">Street Map</span>
                  <span class="text-[9px] text-slate-400">Esri World Street Map</span>
                </button>
                <button
                  class="p-2 rounded border text-left flex flex-col gap-1 transition-all {$gisStore.activeBasemap === 'satellite'
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'}"
                  on:click={() => gisStore.setActiveBasemap("satellite")}
                >
                  <span class="font-bold text-xs">Satellite Ortho</span>
                  <span class="text-[9px] text-slate-400">Esri Imagery</span>
                </button>
              </div>
            </div>

            <hr class="border-slate-900" />

            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">GIS Vector Overlays</span>
              <div class="space-y-2.5 bg-slate-900/40 p-3 rounded-lg border border-slate-900">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={$gisStore.overlayBoundary}
                    on:change={(e) => gisStore.setOverlayBoundary(e.currentTarget.checked)}
                    class="accent-emerald-500 rounded border-slate-700 bg-slate-800 text-emerald-500 h-4 w-4"
                  />
                  <div>
                    <div class="font-semibold text-slate-200">Study Area Campus Boundary</div>
                    <div class="text-[10px] text-slate-500">Draws the UPLB spatial zone limits</div>
                  </div>
                </label>

                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={$gisStore.overlayCentroids}
                    on:change={(e) => gisStore.setOverlayCentroids(e.currentTarget.checked)}
                    class="accent-emerald-500 rounded border-slate-700 bg-slate-800 text-emerald-500 h-4 w-4"
                  />
                  <div>
                    <div class="font-semibold text-slate-200">Calculated Building Centroids</div>
                    <div class="text-[10px] text-slate-500">Renders markers at the center of mass</div>
                  </div>
                </label>

                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={$gisStore.overlayGrid}
                    on:change={(e) => gisStore.setOverlayGrid(e.currentTarget.checked)}
                    class="accent-emerald-500 rounded border-slate-700 bg-slate-800 text-emerald-500 h-4 w-4"
                  />
                  <div>
                    <div class="font-semibold text-slate-200">UTM Alignment Grid</div>
                    <div class="text-[10px] text-slate-500">Overlays grid lines at 0.001° intervals</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        {/if}

        <!-- 2. PROXIMITY & QUERIES TAB -->
        {#if activeTab === "proximity"}
          <div transition:fade={{ duration: 150 }} class="space-y-4">
            <!-- Proximity Network Query -->
            <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-800 space-y-3">
              <div class="flex items-center gap-1.5 text-slate-300">
                <span class="h-1.5 w-1.5 bg-amber-400 rounded-full" />
                <span class="font-bold text-[10px] uppercase tracking-wider text-slate-400">Nearest Facility Network</span>
              </div>

              <div class="space-y-2">
                <span class="block text-[10px] text-slate-400">1. Select Target Category</span>
                <select class="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 outline-none focus:border-emerald-500" bind:value={$gisStore.nearestTargetType}>
                  {#each categories as category}
                    <option value={category}>{category}</option>
                  {/each}
                </select>
              </div>

              <div class="space-y-2">
                <span class="block text-[10px] text-slate-400">2. Select Origin on Map</span>
                <button
                  class="w-full py-1.5 rounded font-semibold text-center border transition-all {$gisStore.gisTool === 'nearest'
                    ? 'border-amber-500 bg-amber-950/20 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850'}"
                  on:click={() => gisStore.setGisTool($gisStore.gisTool === "nearest" ? "none" : "nearest")}
                >
                  {$gisStore.gisTool === "nearest" ? "Origin Tool Active" : "Click Origin on Map"}
                </button>
              </div>

              {#if $gisStore.nearestResult}
                <div class="p-2.5 rounded bg-amber-950/15 border border-amber-900/30 text-amber-200 mt-2 space-y-1.5" transition:slide>
                  <div class="font-semibold text-xs flex justify-between">
                    <span>Nearest {$gisStore.nearestTargetType}:</span>
                    <button
                      class="text-xs text-amber-400 hover:underline"
                      on:click={() => {
                        if ($gisStore.nearestResult) handleSelectBuilding($gisStore.nearestResult.building);
                      }}
                    >
                      Fly To
                    </button>
                  </div>
                  <div class="text-slate-100 font-bold">{$gisStore.nearestResult.building.name}</div>
                  <div class="flex justify-between text-[10px] text-slate-400 mt-1 border-t border-amber-900/20 pt-1.5">
                    <span>Distance: <b class="text-amber-300">{$gisStore.nearestResult.distance.toFixed(1)} m</b></span>
                    <span>Est. Walk Time: <b class="text-amber-300">{$gisStore.nearestResult.walkingTimeMin} min</b></span>
                  </div>
                </div>
              {:else if $gisStore.gisTool === "nearest"}
                <div class="text-[10px] text-amber-400/80 italic text-center animate-pulse">Click anywhere on the map to set starting point...</div>
              {/if}
            </div>

            <!-- Spatial Buffer Tool -->
            <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-800 space-y-3">
              <div class="flex items-center gap-1.5 text-slate-300">
                <span class="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                <span class="font-bold text-[10px] uppercase tracking-wider text-slate-400">Proximity Buffer Query</span>
              </div>

              <div class="space-y-2">
                <div class="flex justify-between text-[10px]">
                  <span class="text-slate-400">Buffer Radius:</span>
                  <span class="text-sky-400 font-bold">{$gisStore.bufferRadius} meters</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  bind:value={$gisStore.bufferRadius}
                  on:change={(e) => gisStore.setBufferRadius(parseInt(e.currentTarget.value))}
                  class="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div class="space-y-2">
                <button
                  class="w-full py-1.5 rounded font-semibold text-center border transition-all {$gisStore.gisTool === 'buffer'
                    ? 'border-sky-500 bg-sky-950/20 text-sky-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850'}"
                  on:click={() => gisStore.setGisTool($gisStore.gisTool === "buffer" ? "none" : "buffer")}
                >
                  {$gisStore.gisTool === "buffer" ? "Buffer Tool Active" : "Set Buffer Center on Map"}
                </button>
              </div>

              {#if $gisStore.bufferResults.length > 0}
                <div class="space-y-1.5 max-h-40 overflow-y-auto mt-2 pr-1" transition:slide>
                  <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    Containment Intersection ({$gisStore.bufferResults.length} found):
                  </div>
                  <div class="space-y-1">
                    {#each $gisStore.bufferResults as result}
                      <button
                        class="w-full flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all text-[11px] text-left"
                        on:click={() => handleSelectBuilding(result.building)}
                      >
                        <span class="truncate pr-2 font-semibold text-slate-300">{result.building.name}</span>
                        <span class="text-[10px] font-mono text-emerald-400 shrink-0">{result.distance.toFixed(0)}m</span>
                      </button>
                    {/each}
                  </div>
                </div>
              {:else if $gisStore.gisTool === "buffer"}
                <div class="text-[10px] text-sky-400/80 italic text-center animate-pulse">Click on the map to run containment query...</div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- 3. MEASUREMENT TAB -->
        {#if activeTab === "measure"}
          <div transition:fade={{ duration: 150 }} class="space-y-4">
            <div class="space-y-2">
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spatial Measurement Tools</span>

              <div class="grid grid-cols-2 gap-2">
                <button
                  class="py-2 px-3 rounded font-semibold text-xs border flex flex-col items-center justify-center gap-1 transition-all {$gisStore.gisTool === 'measure_dist'
                    ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300'}"
                  on:click={() => gisStore.setGisTool($gisStore.gisTool === "measure_dist" ? "none" : "measure_dist")}
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <span>Geodesic Path</span>
                </button>

                <button
                  class="py-2 px-3 rounded font-semibold text-xs border flex flex-col items-center justify-center gap-1 transition-all {$gisStore.gisTool === 'measure_area'
                    ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300'}"
                  on:click={() => gisStore.setGisTool($gisStore.gisTool === "measure_area" ? "none" : "measure_area")}
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                  </svg>
                  <span>Projected Area</span>
                </button>
              </div>
            </div>

            <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-850 space-y-3">
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Calculation Readout</div>

              <div class="space-y-1.5 font-mono text-slate-300">
                <div class="flex justify-between text-xs py-1 border-b border-slate-900">
                  <span>Vertices Clicked:</span>
                  <span class="text-slate-100 font-bold">{$gisStore.measurementPoints.length}</span>
                </div>

                {#if $gisStore.gisTool === "measure_dist" || $gisStore.measurementResult.distance}
                  <div class="flex justify-between text-xs py-1 border-b border-slate-900">
                    <span>Total Length:</span>
                    <span class="text-emerald-400 font-bold">
                      {$gisStore.measurementResult.distance ? $gisStore.measurementResult.distance.toFixed(2) + " m" : "0.00 m"}
                    </span>
                  </div>
                {/if}

                {#if $gisStore.gisTool === "measure_area" || $gisStore.measurementResult.area}
                  <div class="flex justify-between text-xs py-1 border-b border-slate-900">
                    <span>Enclosed Area:</span>
                    <span class="text-emerald-400 font-bold">
                      {$gisStore.measurementResult.area ? $gisStore.measurementResult.area.toFixed(1) + " m²" : "0.0 m²"}
                    </span>
                  </div>
                {/if}
              </div>

              <div class="flex gap-2">
                <button
                  class="flex-1 py-1 bg-rose-950/20 text-rose-400 border border-rose-900/30 hover:border-rose-900/50 rounded font-bold text-[11px] transition-colors"
                  on:click={() => gisStore.clearMeasurements()}
                >
                  Clear Nodes
                </button>
              </div>
            </div>

            {#if $gisStore.gisTool !== "none" && $gisStore.gisTool.startsWith("measure")}
              <div class="text-[10px] text-emerald-400/80 italic text-center animate-pulse">Click multiple locations on the map to plot vertices.</div>
            {/if}
          </div>
        {/if}

        <!-- 4. ATTRIBUTES TAB -->
        {#if activeTab === "attributes"}
          <div transition:fade={{ duration: 150 }} class="space-y-4">
            {#if selectedBuilding}
              <div class="space-y-3">
                <div class="flex justify-between items-start border-b border-slate-900 pb-2">
                  <div>
                    <h2 class="text-sm font-bold text-slate-100">{selectedBuilding.name}</h2>
                    <p class="text-[10px] text-slate-400">{selectedBuilding.type}</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div class="bg-slate-900/50 p-2 rounded border border-slate-900">
                    <span class="text-slate-400 block mb-0.5">Calculated Area</span>
                    <span class="text-emerald-400 text-xs font-bold">{area.toFixed(1)} m²</span>
                  </div>
                  <div class="bg-slate-900/50 p-2 rounded border border-slate-900">
                    <span class="text-slate-400 block mb-0.5">Calculated Perimeter</span>
                    <span class="text-emerald-400 text-xs font-bold">{perimeter.toFixed(1)} m</span>
                  </div>
                </div>

                <div class="space-y-2 bg-slate-900/30 p-2 rounded border border-slate-900 text-[10px] font-mono">
                  <div>
                    <span class="text-slate-400">Centroid:</span>
                    <span class="text-slate-200 block text-[9.5px]">Lat: {centroid?.lat.toFixed(6)} | Lng: {centroid?.lng.toFixed(6)}</span>
                  </div>
                  <div class="border-t border-slate-900 pt-1.5 mt-1.5">
                    <span class="text-slate-400">Bounding Box:</span>
                    <span class="text-slate-200 block text-[9px]">
                      SW: {bbox?.minLat.toFixed(5)}, {bbox?.minLng.toFixed(5)}<br />
                      NE: {bbox?.maxLat.toFixed(5)}, {bbox?.maxLng.toFixed(5)}
                    </span>
                  </div>
                </div>

                <!-- Export WKT Geometry -->
                <div class="space-y-1.5">
                  <div class="flex justify-between items-center">
                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Well-Known Text (WKT)</span>
                    <button class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors" on:click={() => copyToClipboard(wkt, "wkt")}>
                      {copyWktStatus}
                    </button>
                  </div>
                  <textarea
                    readonly
                    value={wkt}
                    class="w-full h-16 bg-slate-950 border border-slate-900 rounded p-1.5 text-[9px] font-mono text-slate-400 resize-none outline-none focus:border-slate-800 select-all"
                  />
                </div>

                <!-- Export GeoJSON Feature -->
                <div class="space-y-1.5">
                  <div class="flex justify-between items-center">
                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GeoJSON Representation</span>
                    <button
                      class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      on:click={() => copyToClipboard(geojson, "geojson")}
                    >
                      {copyGeoJsonStatus}
                    </button>
                  </div>
                  <textarea
                    readonly
                    value={geojson}
                    class="w-full h-24 bg-slate-950 border border-slate-900 rounded p-1.5 text-[9px] font-mono text-slate-400 resize-none outline-none focus:border-slate-800 select-all"
                  />
                </div>
              </div>
            {:else}
              <div class="text-slate-400 text-center py-10 italic">Select a building on the map or search using the searchbar to view spatial geometry attributes.</div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  textarea {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }
</style>
