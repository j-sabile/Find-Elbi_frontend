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
  import { TYPES } from "../../data/constants";
  import FloorDropdowns from "../FloorDropdowns.svelte";

  // Widget State
  let isOpen = true;
  let activeTab: "sections" | "trace" | "summary" = "sections";
  let traceTarget: "building" | "room" = "building";
  let copyStatus = "Copy";

  // Map Integration State
  let draftLayers: L.FeatureGroup | null = null;
  // let drafts: any[] = []; // Recommended: create an IDraft union interface

  // Reactive Data Sources
  $: polygonPoints = $drawBuildingStore.sections.find((s) => $drawBuildingStore.selectedSectionId === s.id)?.polygon || [];
  $: centroid = GeometryService.getCentroid(polygonPoints);

  // Dynamically calculate the next ID based on store + local session drafts
  // $: nextBuildingId = getNextId($dataStoreV2.buildings, drafts);

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

  function getNextId(existingBuildings: any[], currentDrafts: any[]): string {
    const allIds = [...existingBuildings.map((b) => b.id), ...currentDrafts.filter((d) => d.traceTarget === "building").map((d) => d.id)];
    let maxVal = 0;
    allIds.forEach((idStr) => {
      const val = parseInt(idStr, 16);
      if (!isNaN(val) && val > maxVal) {
        maxVal = val;
      }
    });
    return (maxVal + 1).toString(16).toUpperCase().padStart(4, "0");
  }

  // --- Handlers --- //

  function handleSaveDraft(event: CustomEvent) {
    // const draft = { ...event.detail, traceTarget };
    // if (traceTarget === "building") {
    //   gisStoreV2.saveDraftBuilding(draft as any);
    // }
    // drawDraftOnMap(draft);
    // gisStoreV2.clearDraft();
  }

  function handleCopy(event: CustomEvent | string) {
    const textToCopy = typeof event === "string" ? event : event.detail;
    navigator.clipboard.writeText(textToCopy).then(() => {
      copyStatus = "Copied!";
      setTimeout(() => (copyStatus = "Copy"), 2000);
    });
  }

  function clearAllDrafts() {
    if (confirm("Are you sure you want to clear all session drafts?")) {
      // drawBuildingStore.
      // if (draftLayers) draftLayers.clearLayers();
    }
  }

  function copyAllDraftsCode() {
    // if (drafts.length === 0) return;
    // const allCode = drafts.map((d) => d.code).join("\n\n");
    // handleCopy(allCode);
  }

  // --- Map Utilities --- //

  function drawDraftOnMap(draft: any) {
    if (!$mapInstance || !draftLayers) return;

    const isBuilding = draft.traceTarget === "building";
    const pLayer = L.polygon(draft.polygon, {
      color: isBuilding ? "#2563eb" : "#16a34a",
      fillColor: isBuilding ? "#2563eb" : "#16a34a",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "4 4",
    });

    const layers = [pLayer];

    // Only draw marker tooltips for buildings to avoid map clutter
    // if (isBuilding && draft.marker) {
    //   const mLayer = L.marker(draft.marker, {
    //     icon: L.divIcon({
    //       className: "custom-draft-icon",
    //       html: `<div class="flex items-center justify-center w-5 h-5 bg-blue-600 border border-gray-200 rounded-full shadow-lg text-[10px] font-semibold text-white">D</div>`,
    //       iconSize: [20, 20],
    //       iconAnchor: [10, 10],
    //     }),
    //   }).bindTooltip(`<b>${draft.name}</b> (Draft ${draft.id})<br>${draft.type}`, { direction: "top" });

    //   layers.push(mLayer);
    // }

    const group = L.featureGroup(layers).addTo(draftLayers);
    draftLayers.addLayer(group);
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
            <BuildingForm {centroid} {polygonPoints} />
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
              <div class="flex flex-row w-full justify-between items-center">
                <span class="text-sm text-gray-700 font-semibold">Draft</span>
                <div class="flex items-center gap-2">
                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:bg-blue-700"
                    on:click={copyAllDraftsCode}
                  >
                    Copy All
                  </button>
                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-50 transition-colors duration-200"
                    on:click={clearAllDrafts}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                <h3 class="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">Building Details</h3>

                <div class="grid grid-cols-[100px_1fr] gap-y-2 gap-x-3 text-sm">
                  <!-- ID -->
                  <span class="text-gray-500 font-medium">ID</span>
                  <span class="text-gray-800 font-mono text-xs self-center truncate" title={$drawBuildingStore.building.id}>
                    {$drawBuildingStore.building.id}
                  </span>

                  <!-- Name -->
                  <span class="text-gray-500 font-medium">Name</span>
                  <span class="text-gray-800 font-medium">
                    {$drawBuildingStore.building.name || "Unnamed Building"}
                  </span>

                  <!-- Alternate Names -->
                  <span class="text-gray-500 font-medium">Alt Names</span>
                  <span class="text-gray-800">
                    {#if $drawBuildingStore.building.alternateNames && $drawBuildingStore.building.alternateNames.length > 0}
                      {$drawBuildingStore.building.alternateNames.join(", ")}
                    {:else}
                      <span class="text-gray-400 italic">None</span>
                    {/if}
                  </span>

                  <!-- Address -->
                  <span class="text-gray-500 font-medium">Address</span>
                  <span class="text-gray-800">
                    {$drawBuildingStore.building.address || "No address provided"}
                  </span>

                  <!-- Polygon Vertices -->
                  <span class="text-gray-500 font-medium">Polygon</span>
                  <span class="text-gray-800">
                    <span class="font-semibold text-blue-600">
                      {$drawBuildingStore.building.polygon?.length || 0}
                    </span> vertices
                  </span>

                  <!-- Type / College -->
                  <span class="text-gray-500 font-medium">Type</span>
                  <span class="text-gray-800 capitalize">
                    {$drawBuildingStore.building.type.replace("_", " ")}
                    {#if $drawBuildingStore.building.type === TYPES.ACADEMIC}
                      ({$drawBuildingStore.building.college})
                    {/if}
                  </span>
                </div>
              </div>
              <FloorDropdowns building={$drawBuildingStore.building} />
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
