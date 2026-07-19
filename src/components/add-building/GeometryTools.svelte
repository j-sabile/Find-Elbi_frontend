<script lang="ts">
  import { drawBuildingStore, selectedSection } from "../../stores/drawBuilding";
  import { GeometryService } from "../../services/GeometryService";
  import { Eye, EyeOff, Trash } from "lucide-svelte";
  import { parseNumberArray } from "../../utils/buildingGenerator";
  import { type Section } from "../../interfaces/IBuilding";

  const drawingTools = [
    {
      label: "Rectangle",
      type: "number",
      value: "generate_rectangle",
      inputLabel: "Rectangle Width",
      unit: "m",
      min: -99999,
      max: 99999,
      step: 1,
      placeholder: "e.g., 5",
      helpText: "Enter the total width of the rectangle in meters.",
      requiredPoints: 2,
      optionLabel: "Direction",
    },
    {
      label: "Right Triangle",
      type: "number",
      value: "generate_right_triangle",
      inputLabel: "Degrees",
      unit: "",
      min: 0,
      max: 90,
      step: 1,
      placeholder: "e.g., 5",
      helpText: "Enter the degrees for the triangle in meters.",
      requiredPoints: 2,
      optionLabel: null,
    },
    {
      label: "Points at %",
      type: "text",
      value: "generate_points_along_segment",
      inputLabel: "Split Percentages",
      unit: "%",
      min: 1,
      max: 99,
      step: 1,
      placeholder: "e.g. 25 50 75",
      helpText: "Enter space-separated percentages to split the segment at multiple points.",
      requiredPoints: 2,
      optionLabel: null,
    },
    {
      label: "Equidistant Points",
      type: "number",
      value: "generate_equally_spaced_points",
      inputLabel: "Number of Points",
      unit: "pts",
      min: 3,
      max: 99,
      step: 1,
      placeholder: "Min. 3",
      helpText: "Creates multiple points with equal distances between them (must be a whole number of 3 or more).",
      requiredPoints: 2,
      optionLabel: null,
    },
    {
      label: "Split Area by Percentages",
      type: "text",
      value: "split_area_by_percentages",
      inputLabel: "Cut Percentages",
      unit: "%",
      placeholder: "e.g., 20 40 60",
      helpText: "Enter percentages separated by spaces or commas to cut the area into smaller polygon sections.",
      requiredPoints: 4,
      optionLabel: "Split Edge",
    },
  ] as const;

  let selectedTool: (typeof drawingTools)[number]["value"] | null = null;
  let toolParam: number | string | null = null; // Changed to null so placeholder shows up on fresh click
  let switchDirectionValue = false;

  function executeSelectedTool(toolParam: number | string) {
    const pts = $selectedSection ? $selectedSection.polygon : $drawBuildingStore.draftPoints;
    if (!toolParam) return [];

    let newPolygons: [number, number][][] = [];

    if (selectedTool === "generate_rectangle") {
      newPolygons = [GeometryService.generateRectanglePoints(pts[0], pts[1], Number(toolParam) * (switchDirectionValue ? 1 : -1))];
    } else if (selectedTool === "generate_equally_spaced_points") {
      newPolygons = [GeometryService.generateEquallySpaced(pts[0], pts[1], Number(toolParam))];
      drawBuildingStore.clearDraft();
    } else if (selectedTool === "generate_points_along_segment") {
      const distancesArray = parseNumberArray(toolParam);
      if (distancesArray.length === 0) return [];
      newPolygons = [GeometryService.generatePointsAlong(pts[0], pts[1], distancesArray)];
    } else if (selectedTool === "split_area_by_percentages") {
      const distancesArray = parseNumberArray(toolParam);
      if (distancesArray.length === 0) return [];
      newPolygons = GeometryService.splitQuadrilateralByPercentages(pts, distancesArray, switchDirectionValue ? 0 : 1);
    }

    const newSections: Section[] = newPolygons.map((p, ind) => ({ id: `SEC${ind + 1}`, polygon: p }));
    drawBuildingStore.setPreviewSections(newSections);
  }

  function handleActiveToolValueChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    executeSelectedTool(value);
  }

  function handleSwitchDirectionChange() {
    if (toolParam === null) return;
    switchDirectionValue = !switchDirectionValue;
    executeSelectedTool(toolParam);
  }

  function handleSaveClick() {
    if (toolParam === null) return;
    executeSelectedTool(toolParam);
    drawBuildingStore.savePreviewSections();
  }

  $: activeToolConfig = drawingTools.find((t) => t.value === selectedTool);
</script>

<div class="flex flex-col gap-4 w-full">
  {#if $drawBuildingStore.procedure !== "generate_sections"}
    <button
      class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-blue-700 w-full"
      on:click={() => drawBuildingStore.setProcedure("generate_sections")}
    >
      ▶ Start
    </button>
  {:else}
    <div class="flex items-center gap-3 w-full">
      <button
        class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
        on:click={() => drawBuildingStore.removeLastDraftPoint()}
      >
        ↶ Undo
      </button>
      <button
        class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-blue-700"
        on:click={() => {
          drawBuildingStore.saveAsSection();
          drawBuildingStore.setProcedure("idle");
        }}
      >
        ✓ Done
      </button>
    </div>
  {/if}
  <button
    class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200 w-full"
    on:click={() => drawBuildingStore.setShowAllSectionPoints(!$drawBuildingStore.showAllSectionPoints)}
  >
    {#if $drawBuildingStore.showAllSectionPoints}
      <Eye class="w-4 h-4 shrink-0 text-gray-500" />
      Hide All Section Points
    {:else}
      <EyeOff class="w-4 h-4 shrink-0 text-gray-500" />
      Show All Section Points
    {/if}
  </button>
  <hr />

  <!-- TOOLS SELECTION -->
  <div class="grid gap-3 grid-cols-2">
    {#each drawingTools as tool}
      <button
        class="inline-flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-[10.5px] font-medium transition-colors duration-200 {selectedTool === tool.value
          ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'} disabled:opacity-50"
        on:click={() => {
          selectedTool = selectedTool === tool.value ? null : tool.value;
          toolParam = null; // Reset param when switching tools
        }}
        disabled={$drawBuildingStore.draftPoints.length != tool.requiredPoints && $selectedSection?.polygon.length != tool.requiredPoints}
      >
        {tool.label}
      </button>
    {/each}
  </div>

  <!-- SHOW SELECTED TOOL -->
  {#if activeToolConfig}
    <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
      <div class="flex flex-col gap-1">
        <label for="tool-input" class="text-sm font-semibold text-gray-800">
          {activeToolConfig.inputLabel}
        </label>
        <p class="text-[11px] text-gray-500 leading-tight">
          {activeToolConfig.helpText}
        </p>
      </div>

      <div class="relative flex items-center">
        {#if activeToolConfig.type === "number"}
          <input
            id="tool-input"
            type="number"
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pr-10"
            bind:value={toolParam}
            min={activeToolConfig.min}
            max={activeToolConfig.max}
            step={activeToolConfig.step}
            placeholder={activeToolConfig.placeholder}
            on:input={handleActiveToolValueChange}
          />
        {:else}
          <input
            id="tool-input"
            type="text"
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pr-10"
            bind:value={toolParam}
            placeholder={activeToolConfig.placeholder}
            on:input={handleActiveToolValueChange}
          />
        {/if}

        {#if activeToolConfig.unit}
          <span class="absolute right-3 text-sm font-medium text-gray-400 pointer-events-none">
            {activeToolConfig.unit}
          </span>
        {/if}
      </div>
      {#if activeToolConfig.optionLabel}
        <div class="flex flex-row justify-between items-center w-fulls">
          {activeToolConfig.optionLabel}
          <button class="rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200" on:click={handleSwitchDirectionChange}>
            ↔ Switch
          </button>
        </div>
      {/if}

      <button
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-400 hover:shadow-md"
        on:click={handleSaveClick}
        disabled={!toolParam || (activeToolConfig.type === "number" && Number(toolParam) < (activeToolConfig.min ?? 0))}
      >
        Save
      </button>
    </div>
  {/if}

  <!-- SECTIONS LIST -->
  {#if $drawBuildingStore.building?.sections && $drawBuildingStore.building.sections.length > 0}
    <hr />
    <div class="flex flex-col gap-3">
      <h3 class="text-sm font-semibold text-gray-800">Generated Sections</h3>
      <div class="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
        {#each $drawBuildingStore.building.sections as section, i (section.id)}
          <button
            class="flex items-center justify-between p-3 rounded-lg border transition-colors duration-200 shadow-sm group cursor-pointer
              {section.id === $drawBuildingStore.selectedSectionId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}"
            on:click={() => drawBuildingStore.setSelectedSection(section.id)}
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-700">Section {i + 1}</span>
              <span class="text-[11px] text-gray-500">{section.polygon.length} points</span>
            </div>
            <button
              class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 opacity-0 group-hover:opacity-100"
              on:click={() => drawBuildingStore.deleteSection(section.id)}
              title="Delete Section"
            >
              <Trash class="w-4 h-4 shrink-0" />
            </button>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
