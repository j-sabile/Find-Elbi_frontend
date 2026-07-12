<script lang="ts">
  import { gisStoreV2 } from "../stores/gisV2";
  import { createEventDispatcher } from "svelte";
  import { Ruler, Square, Spline, Undo2, Eraser } from "lucide-svelte";
  import ToolPanelV2 from "./ToolPanelV2.svelte";

  const dispatch = createEventDispatcher();

  type MeasureMode = "measure_dist" | "measure_area";

  const modes: { id: MeasureMode; label: string; icon: typeof Ruler; hint: string }[] = [
    { id: "measure_dist", label: "Distance", icon: Spline, hint: "Click points to trace a path" },
    { id: "measure_area", label: "Area", icon: Square, hint: "Click points to draw a polygon" },
  ];

  $: activeMode = $gisStoreV2.activeTool === "measure_dist" || $gisStoreV2.activeTool === "measure_area" ? $gisStoreV2.activeTool : null;
  $: points = $gisStoreV2.draftPoints;
  $: result = $gisStoreV2.measurementResult || {};

  function selectMode(mode: MeasureMode) {
    gisStoreV2.setActiveTool(mode);
  }

  function start() {
    if (!activeMode) return;
    gisStoreV2.clearDraft();
  }

  function undo() {
    gisStoreV2.undoLastPoint();
  }

  function clear() {
    gisStoreV2.clearDraft();
  }

  function formatDistance(m: number | undefined): string {
    if (m === undefined || Number.isNaN(m)) return "0.0 m";
    return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(1)} m`;
  }

  function formatArea(area: number | undefined): string {
    if (area === undefined || Number.isNaN(area)) return "0 m²";
    const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
    return `${formatter.format(area)} m²`;
  }
</script>

<ToolPanelV2 title="Measure" showClose closeOnOutside={false} on:close={() => dispatch("close")}>
  <div class="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3 mt-1">
    {#each modes as mode}
      <button
        class="flex flex-row items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg border transition-all duration-200 w-full {activeMode === mode.id
          ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'}"
        on:click={() => selectMode(mode.id)}
      >
        <svelte:component this={mode.icon} class="w-4 h-4 shrink-0 {activeMode === mode.id ? 'text-blue-600' : 'text-gray-500'}" />
        <span class="text-sm font-medium">{mode.label}</span>
      </button>
    {/each}
  </div>

  {#if activeMode}
    <div class="bg-gray-50 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-gray-200 shadow-inner">
      {#if activeMode === "measure_dist"}
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Distance</span>
            <span class="text-xs text-gray-600 mt-0.5">Points: <span class="font-medium text-gray-900">{points.length}</span></span>
          </div>
          <span class="text-xl sm:text-2xl font-bold text-gray-900">{formatDistance(result.distance)}</span>
        </div>
      {:else if activeMode === "measure_area"}
        <div class="flex items-center justify-between mb-1.5 sm:mb-2">
          <span class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Area</span>
          <span class="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{formatArea(result.area)}</span>
        </div>
        <div class="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-gray-200/60 text-[11px] sm:text-xs">
          <span class="text-gray-600">Perim: <span class="font-medium text-gray-900">{formatDistance(result.distance)}</span></span>
          <span class="text-gray-600">Points: <span class="font-medium text-gray-900">{points.length}</span></span>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-1.5 sm:gap-2">
      {#if points.length === 0}
        <button
          class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-1.5 sm:py-2 text-sm font-medium shadow-sm transition-all duration-200 hover:bg-blue-700"
          on:click={start}
        >
          <Ruler class="w-4 h-4 shrink-0" />
          Start Measuring
        </button>
      {:else}
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-3 py-1.5 sm:py-2 text-sm font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm"
          on:click={undo}
        >
          <Undo2 class="w-4 h-4 shrink-0" />
          Undo
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-600 px-3 py-1.5 sm:py-2 text-sm font-medium hover:bg-red-100 transition-all duration-200 shadow-sm"
          on:click={clear}
        >
          <Eraser class="w-4 h-4 shrink-0" />
          Clear
        </button>
      {/if}
    </div>

    <div class="text-center sm:mt-2">
      <span class="text-[10px] sm:text-[11px] text-gray-400 italic">
        {modes.find((m) => m.id === activeMode)?.hint}
      </span>
    </div>
  {/if}
</ToolPanelV2>
