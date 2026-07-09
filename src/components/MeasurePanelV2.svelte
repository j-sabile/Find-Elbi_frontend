<script lang="ts">
  import { gisStore } from "../stores/gis";
  import type { GisToolType } from "../stores/gis";
  import { createEventDispatcher } from "svelte";
  import { Ruler, Square, Spline, Undo2, Eraser } from "lucide-svelte";
  import ToolPanelV2 from "./ToolPanelV2.svelte";

  const dispatch = createEventDispatcher();

  type MeasureMode = "measure_dist" | "measure_area";

  const modes: { id: MeasureMode; label: string; icon: typeof Ruler; hint: string }[] = [
    { id: "measure_dist", label: "Distance", icon: Spline, hint: "Click points to trace a path" },
    { id: "measure_area", label: "Area", icon: Square, hint: "Click points to draw a polygon" },
  ];

  $: activeMode = $gisStore.gisTool === "measure_dist" || $gisStore.gisTool === "measure_area" ? $gisStore.gisTool : null;
  $: points = $gisStore.measurementPoints;
  $: result = $gisStore.measurementResult;

  function selectMode(mode: MeasureMode) {
    gisStore.setGisTool(mode);
  }

  function start() {
    if (!activeMode) return;
    // Begin a fresh measurement: clear any prior points/result for the active mode.
    gisStore.clearMeasurements();
  }

  function undo() {
    gisStore.undoMeasurementPoint();
  }

  function clear() {
    gisStore.clearMeasurements();
  }

  function formatDistance(m: number | undefined): string {
    if (m === undefined || Number.isNaN(m)) return "—";
    return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(1)} m`;
  }

  function formatArea(area: number | undefined): string {
    if (area === undefined || Number.isNaN(area)) return "—";
    const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
    return `${formatter.format(area)} m²`;
  }
</script>

<ToolPanelV2 title="Measure" showClose closeOnOutside={false} on:close={() => dispatch("close")}>
  <span class="text-sm text-gray-500">Measure distance or area by clicking points on the map</span>

  <!-- Mode toggle -->
  <div class="grid grid-cols-2 gap-3">
    {#each modes as mode}
      <button
        class="flex flex-col items-center justify-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:bg-gray-50 w-full {activeMode === mode.id
          ? 'bg-blue-50 border-blue-300'
          : 'border-gray-200 bg-white'}"
        on:click={() => selectMode(mode.id)}
      >
        <svelte:component this={mode.icon} class="w-5 h-5 shrink-0 text-gray-700" />
        <span class="text-sm font-medium text-gray-900">{mode.label}</span>
      </button>
    {/each}
  </div>

  {#if activeMode}
    <span class="text-xs text-gray-500">{modes.find((m) => m.id === activeMode)?.hint}</span>
  {/if}

  <!-- Actions -->
  <div class="flex items-center gap-3">
    <button
      class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      on:click={start}
      disabled={!activeMode}
    >
      <Ruler class="w-5 h-5 shrink-0" />
      Start
    </button>
    <button
      class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      on:click={undo}
      disabled={points.length === 0}
    >
      <Undo2 class="w-5 h-5 shrink-0" />
      Undo
    </button>
    <button
      class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      on:click={clear}
      disabled={points.length === 0}
    >
      <Eraser class="w-5 h-5 shrink-0" />
      Clear
    </button>
  </div>

  <!-- Live readout -->
  <div class="flex flex-col gap-3 border-t border-gray-200 pt-4">
    <div class="flex items-center justify-between gap-3">
      <span class="text-sm text-gray-700">Points</span>
      <span class="text-sm font-medium text-gray-900">{points.length}</span>
    </div>
    {#if activeMode === "measure_dist"}
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-gray-700">Distance</span>
        <span class="text-sm font-medium text-gray-900">{formatDistance(result.distance)}</span>
      </div>
    {:else if activeMode === "measure_area"}
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-gray-700">Area</span>
        <span class="text-sm font-medium text-gray-900">{formatArea(result.area)}</span>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-gray-700">Perimeter</span>
        <span class="text-sm font-medium text-gray-900">{formatDistance(result.distance)}</span>
      </div>
    {/if}
  </div>
</ToolPanelV2>
