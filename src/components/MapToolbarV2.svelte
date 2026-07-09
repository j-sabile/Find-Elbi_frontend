<script lang="ts">
  import { Layers, Map as MapIcon, Ruler, LocateFixed } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { createEventDispatcher } from "svelte";
  import { gisStore } from "../stores/gis";
  import BasemapPanelV2 from "./BasemapPanelV2.svelte";
  import MeasurePanelV2 from "./MeasurePanelV2.svelte";

  const dispatch = createEventDispatcher();

  let showBasemap = false;
  let showMeasure = false;

  const tools = [
    { id: "basemap", label: "Basemaps", icon: MapIcon },
    { id: "measure", label: "Measure", icon: Ruler },
    { id: "locate", label: "Locate", icon: LocateFixed },
  ];

  function handleClick(id: string) {
    if (id === "basemap") {
      showBasemap = !showBasemap;
      if (showBasemap) {
        showMeasure = false;
        gisStore.setGisTool("none");
      }
    } else if (id === "measure") {
      showMeasure = !showMeasure;
      if (showMeasure) {
        showBasemap = false;
        if ($gisStore.gisTool !== "measure_dist" && $gisStore.gisTool !== "measure_area") {
          gisStore.setGisTool("measure_dist");
        }
      } else {
        gisStore.setGisTool("none");
      }
    }
  }

  function closeBasemap() {
    showBasemap = false;
  }

  function closeMeasure() {
    showMeasure = false;
    gisStore.setGisTool("none");
  }

  function clickOutside(node: HTMLElement) {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (node && !node.contains(target) && !target.closest('[title="Basemaps"]')) {
        showBasemap = false;
      }
    };

    document.addEventListener("click", handleClick, true);

    return {
      destroy() {
        document.removeEventListener("click", handleClick, true);
      },
    };
  }
</script>

<div class="absolute bottom-4 right-4 z-20 flex flex-col gap-4 items-end">
  <div class="relative w-full min-h-0">
    {#if showBasemap}
      <div class="absolute bottom-0 right-0" use:clickOutside transition:fly={{ y: 20, duration: 250 }}>
        <BasemapPanelV2 on:close={closeBasemap} />
      </div>
    {/if}

    {#if showMeasure}
      <div class="absolute bottom-0 right-0" transition:fly={{ y: 20, duration: 250 }}>
        <MeasurePanelV2 on:close={closeMeasure} />
      </div>
    {/if}
  </div>

  <div class="flex gap-3 bg-white border border-gray-200 rounded-2xl shadow-lg p-4">
    {#each tools as tool}
      <button
        class="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200
        {tool.id === 'basemap' && showBasemap ? 'border-blue-300 bg-blue-50' : ''} 
        {tool.id === 'measure' && showMeasure ? 'border-blue-300 bg-blue-50' : ''}"
        title={tool.label}
        on:click={() => handleClick(tool.id)}
      >
        <svelte:component this={tool.icon} class="w-5 h-5 shrink-0 text-gray-700" />
      </button>
    {/each}
  </div>
</div>
