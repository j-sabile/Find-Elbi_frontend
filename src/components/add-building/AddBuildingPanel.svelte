<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import L from "leaflet";

  // Stores
  import { gisStoreV2 } from "../../stores/gisV2";
  import { dataStoreV2 } from "../../stores/dataV2";
  import { mapInstance } from "../../stores/mapV2";

  // Services & Utilities
  import { GeometryService } from "../../services/GeometryService";

  // Child Components
  import BuildingForm from "./BuildingForm.svelte";
  import RoomForm from "./RoomForm.svelte";
  import GeometryTools from "./GeometryTools.svelte";
  import { drawBuildingStore } from "../../stores/drawBuilding";
  import { BUILDING_TYPES } from "../../data/constants";
  import FloorDropdowns from "../FloorDropdowns.svelte";
  import { copyBuildingJsonToClipboard } from "../../utils/copyBuildingToClipboard";

  // Widget State
  let isOpen = true;
  let activeTab: "sections" | "trace" | "summary" = "sections";
  let traceTarget: "building" | "room" = "building";

  let draftLayers: L.FeatureGroup | null = null;

  // Reactive Data Sources
  $: polygonPoints = $drawBuildingStore.building?.sections.find((s) => $drawBuildingStore.selectedSectionId === s.id)?.polygon || [];
  $: centroid = GeometryService.getCentroid(polygonPoints);

  onMount(() => {
    if ($mapInstance) {
      draftLayers = L.featureGroup().addTo($mapInstance);
    }
  });

  onDestroy(() => {
    if (draftLayers && $mapInstance) {
      draftLayers.removeFrom($mapInstance);
    }
  });

  // --- Handlers --- //
  function clearAllDrafts() {
    confirm("Are you sure you want to clear all session drafts?");
  }

  function copyCode() {
    if ($drawBuildingStore.building) copyBuildingJsonToClipboard($drawBuildingStore.building);
  }
</script>

<div class="absolute top-4 left-4 z-20 flex flex-col pointer-events-auto select-none">
  {#if !isOpen}
    <button
      class="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200"
      on:click={() => (isOpen = true)}
      title="Open Spatial Adder Tool"
    >
      <svg class="w-5 h-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  {:else}
    <div class="bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col overflow-hidden w-80 md:w-96">
      <div class="p-4 flex items-center justify-between gap-3 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div class="flex flex-col">
            <h1 class="text-lg font-semibold tracking-tight text-gray-900">Add Spatial Data</h1>
            <p class="text-xs text-gray-500">Interactive Polygon Creator</p>
          </div>
        </div>
        <button class="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200" on:click={() => (isOpen = false)}>
          <svg class="w-5 h-5 shrink-0 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex items-center justify-between gap-3 p-4 border-b border-gray-200">
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 {activeTab === 'sections'
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = "sections")}
        >
          Sections
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 {activeTab === 'trace'
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = "trace")}
        >
          Trace
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 {activeTab === 'summary'
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = "summary")}
        >
          Summary
        </button>
      </div>

      <div class="flex flex-col gap-3 p-4 overflow-y-auto max-h-[28rem]">
        {#if activeTab === "trace"}
          <div class="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              class="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 {traceTarget === 'building'
                ? 'bg-blue-50 border border-blue-300 text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}"
              on:click={() => (traceTarget = "building")}
            >
              Building
            </button>
            <button
              class="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 {traceTarget === 'room'
                ? 'bg-blue-50 border border-blue-300 text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}"
              on:click={() => (traceTarget = "room")}
            >
              Room
            </button>
          </div>

          {#if traceTarget === "building"}
            <BuildingForm {polygonPoints} />
          {:else}
            <RoomForm {polygonPoints} />
          {/if}
        {:else if activeTab === "sections"}
          <GeometryTools />
        {:else if activeTab === "summary"}
          <div class="flex flex-col gap-3">
            {#if $drawBuildingStore.building === null}
              <div class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 text-center">
                <span class="text-sm text-gray-700">No spatial vectors are saved yet.</span>
                <span class="text-xs text-gray-500">Trace a section and save to store it here for export.</span>
              </div>
            {:else}
              <div class="flex flex-col h-full w-full">
                <!-- Main Content Flow -->
                <div class="flex flex-col pb-6">
                  <!-- 1. HEADER: Identity (Name, Chips, Alt Names) -->
                  <div class="flex flex-col gap-3 border-b border-gray-100 pb-5">
                    <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
                      {$drawBuildingStore.building.name || "Unnamed Building"}
                    </h1>

                    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <!-- Chips -->
                      <span class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100 capitalize">
                        {$drawBuildingStore.building.type.replace("_", " ")}
                      </span>

                      {#if $drawBuildingStore.building.type === BUILDING_TYPES.ACADEMIC}
                        <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
                          {$drawBuildingStore.building.college}
                        </span>
                      {/if}

                      <!-- Alt Names -->
                      {#if $drawBuildingStore.building.alternateNames && $drawBuildingStore.building.alternateNames.length > 0}
                        <span class="hidden sm:inline text-gray-300">&vert;</span>
                        <span class="text-sm font-medium">
                          {$drawBuildingStore.building.alternateNames.join(", ")}
                        </span>
                        | <span class="text-sm">{$drawBuildingStore.building.address}</span>
                      {/if}
                    </div>
                  </div>

                  <!-- 3. CONTENTS: Floor Plans -->
                  <div class="flex flex-col mt-2">
                    <h2 class="text-lg font-semibold text-gray-900">Floor Plans</h2>
                    <div class="w-full">
                      <FloorDropdowns building={$drawBuildingStore.building} />
                    </div>
                  </div>
                </div>

                <!-- 4. ACTIONS BAR (Pushed to bottom) -->
                <div class="mt-auto pt-5 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                  <button
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2.5 text-sm font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    on:click={clearAllDrafts}
                  >
                    Clear All
                  </button>
                  <button
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shadow-sm"
                    on:click={copyCode}
                  >
                    Copy All
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.custom-draft-icon) {
    background: transparent !important;
    border: none !important;
  }
</style>
