<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import L from "leaflet";
  import { gisStoreV2 } from "../stores/gisV2";
  import { dataStoreV2 } from "../stores/dataV2";
  import { mapInstance } from "../stores/mapV2";
  import { TYPES, COLLEGES } from "../data/constants";
  import { calculatePolygonArea, calculatePolygonPerimeter } from "../utils/gisConvert";
  import { drawBuildingStore } from "../stores/drawBuilding";
  import { Trash } from "lucide-svelte";
  import { createRectangleFromLine, flipLatLng, generateEquallySpacedPoints, getPointsAlongSegment } from "../utils/buildingGenerator";
  import * as turf from "@turf/turf";

  // State
  let isOpen = true;
  let activeTab: "generate sections" | "trace perimeter" | "form" | "code" | "drafts" = "form";
  const drawingTools = [
    { label: "Generate Rectangle", value: "generate_rectangle" },
    { label: "Generate Right Triangle", value: "generate_right_triangle" },
    { label: "Generate Points Along Segment", value: "generate_points_along_segment" },
    { label: "Generate Equally Spaced Points", value: "generate_equally_spaced_points" },
  ] as const;
  type DrawingTools = (typeof drawingTools)[number]["value"];
  let selectedDrawingTool: DrawingTools | null = null;
  let drawingToolParam = 0;

  // Form Fields
  let id = "";
  let name = "";
  let type = TYPES.ACADEMIC;
  let college = COLLEGES.CAS;
  let alternateNamesStr = "";
  let address = "";

  // Leaflet Layer References (only for persisted draft previews)
  let draftLayers: L.FeatureGroup | null = null;

  // Saved drafts for this session
  let drafts: any[] = [];

  // Notification / Copy state
  let copyStatus = "Copy Code";
  let saveStatus = "Save Draft";

  // Drawing state is driven entirely by the gisStore tool selection so that
  // map clicks are routed correctly through Map.svelte (single click handler).
  $: isDrawing = $gisStoreV2.activeTool === "draw_building";
  $: polygonPoints = $gisStoreV2.draftPoints;

  // Initialize
  onMount(() => {
    id = getNextId();
    if ($mapInstance) {
      draftLayers = L.featureGroup().addTo($mapInstance);
    }
  });

  onDestroy(() => {
    if (draftLayers && $mapInstance) {
      draftLayers.removeFrom($mapInstance);
    }
  });

  // Calculate next hexadecimal ID (e.g. 001E)
  function getNextId(): string {
    const allIds = [...$dataStoreV2.buildings.map((b) => b.id), ...drafts.map((d) => d.id)];
    let maxVal = 0;
    allIds.forEach((idStr) => {
      const val = parseInt(idStr, 16);
      if (!isNaN(val) && val > maxVal) {
        maxVal = val;
      }
    });
    return (maxVal + 1).toString(16).toUpperCase().padStart(4, "0");
  }

  function getCentroid(pts: [number, number][]): [number, number] {
    if (pts.length === 0) return [0, 0];
    let latSum = 0;
    let lngSum = 0;
    pts.forEach(([lat, lng]) => {
      latSum += lat;
      lngSum += lng;
    });
    return [parseFloat((latSum / pts.length).toFixed(6)), parseFloat((lngSum / pts.length).toFixed(6))];
  }

  function handleUndo() {
    if (polygonPoints.length === 0) return;
    gisStoreV2.undoLastPoint();
  }

  function handleClear() {
    gisStoreV2.clearDraft();
  }

  // Reactive variables for details
  $: centroid = getCentroid(polygonPoints);
  $: area = calculatePolygonArea(polygonPoints);
  $: perimeter = calculatePolygonPerimeter(polygonPoints);

  // Format Alternate Names
  $: alternateNames = alternateNamesStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Computed generated code block
  $: codeBlock = generateCodeBlock(id, name, type, college, alternateNames, address, centroid, polygonPoints);

  function generateCodeBlock(
    idVal: string,
    nameVal: string,
    typeVal: TYPES,
    collegeVal: COLLEGES,
    altNamesVal: string[],
    addressVal: string,
    centroidVal: [number, number],
    polygonPtsVal: [number, number][],
  ): string {
    const isAcademic = typeVal === TYPES.ACADEMIC;

    const formattedAlts = altNamesVal.length > 0 ? `[${altNamesVal.map((n) => `"${n}"`).join(", ")}]` : "[]";

    const formattedPolygon = polygonPtsVal.length > 0 ? `[\n${polygonPtsVal.map((p) => `      [${p[0]}, ${p[1]}]`).join(",\n")}\n    ]` : "[]";

    return `  {
    id: "${idVal}",
    name: "${nameVal || "Unnamed Building"}",
    type: TYPES.${Object.keys(TYPES).find((k) => TYPES[k as keyof typeof TYPES] === typeVal) || "ACADEMIC"},
${isAcademic ? `    college: COLLEGES.${Object.keys(COLLEGES).find((k) => COLLEGES[k as keyof typeof COLLEGES] === collegeVal) || "CAS"},\n` : ""}    alternateNames: ${formattedAlts},
    address: "${addressVal || "Unknown Road"}",
    marker: [${centroidVal[0]}, ${centroidVal[1]}],
    polygon: ${formattedPolygon},
  },`;
  }

  function copyCode() {
    navigator.clipboard.writeText(codeBlock).then(() => {
      copyStatus = "Copied!";
      setTimeout(() => {
        copyStatus = "Copy Code";
      }, 2000);
    });
  }

  function saveDraft() {
    if (polygonPoints.length < 3) {
      alert("Please draw a polygon with at least 3 points before saving.");
      return;
    }

    const draftMeta = {
      id,
      name: name || "Unnamed Building",
      type,
      college: type === TYPES.ACADEMIC ? college : undefined,
      alternateNames,
      address: address || "Unknown Road",
    };

    const draft = {
      ...draftMeta,
      marker: centroid,
      polygon: [...polygonPoints],
      code: codeBlock,
    };

    gisStoreV2.saveDraftBuilding(draftMeta as any);
    drafts = [...drafts, draft];

    // Add to preview layers on map
    if ($mapInstance && draftLayers) {
      const pLayer = L.polygon(draft.polygon, {
        color: "#2563eb", // blue-600
        fillColor: "#2563eb",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "4 4",
      });

      const mLayer = L.marker(draft.marker, {
        icon: L.divIcon({
          className: "custom-draft-icon",
          html: `<div class="w-5 h-5 bg-blue-500 border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-[10px] font-semibold text-white">D</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).bindTooltip(`<b>${draft.name}</b> (Draft ${draft.id})<br>${draft.type}`, { direction: "top" });

      const group = L.featureGroup([pLayer, mLayer]).addTo(draftLayers);
      draftLayers.addLayer(group);
    }

    // Reset for next building, maintaining drawing status
    name = "";
    alternateNamesStr = "";
    address = "";
    gisStoreV2.clearDraft();

    // Auto-update ID for next draft
    id = getNextId();

    saveStatus = "Saved!";
    setTimeout(() => {
      saveStatus = "Save Draft";
    }, 2000);
  }

  function clearAllDrafts() {
    if (confirm("Are you sure you want to clear all drafts for this session?")) {
      drafts = [];
      if (draftLayers) {
        draftLayers.clearLayers();
      }
      id = getNextId();
    }
  }

  function copyAllDraftsCode() {
    if (drafts.length === 0) return;
    const allCode = drafts.map((d) => d.code).join("\n\n");
    navigator.clipboard.writeText(allCode).then(() => {
      alert("All drafted buildings code copied to clipboard!");
    });
  }

  function generateRectangle() {
    const pointA = turf.point(flipLatLng($drawBuildingStore.draftPoints[0]));
    const pointB = turf.point(flipLatLng($drawBuildingStore.draftPoints[1]));
    const newPolygon = createRectangleFromLine(pointA, pointB, drawingToolParam, true);
    drawBuildingStore.addDraftPoint(flipLatLng(newPolygon.geometry.coordinates[0][2] as unknown as [number, number]));
    drawBuildingStore.addDraftPoint(flipLatLng(newPolygon.geometry.coordinates[0][3] as unknown as [number, number]));
  }

  function handleGenerateEquallySpacedPoints() {
    const pointA = turf.point(flipLatLng($drawBuildingStore.draftPoints[0]));
    const pointB = turf.point(flipLatLng($drawBuildingStore.draftPoints[1]));
    const newPolygon = generateEquallySpacedPoints(pointA, pointB, drawingToolParam);
    drawBuildingStore.clearDraft();
    for (const [_, coords] of newPolygon.entries()) {
      drawBuildingStore.addDraftPoint(flipLatLng(coords as unknown as [number, number]));
    }
  }

  function handleGeneratePointsAlongSegment() {
    const pointA = turf.point(flipLatLng($drawBuildingStore.draftPoints[0]));
    const pointB = turf.point(flipLatLng($drawBuildingStore.draftPoints[1]));
    const newPolygon = getPointsAlongSegment(pointA, pointB, [drawingToolParam]);
    console.log(newPolygon);
    for (const [_, coords] of newPolygon.entries()) {
      drawBuildingStore.addDraftPoint(flipLatLng(coords as unknown as [number, number]));
    }
  }
</script>

<!-- Add Building Floating Card -->
<div class="absolute top-4 left-4 z-20 flex flex-col pointer-events-auto select-none">
  {#if !isOpen}
    <!-- Collapsed Toggle Button -->
    <button
      class="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200"
      on:click={() => (isOpen = true)}
      title="Open Building Adder Tool"
    >
      <svg class="w-5 h-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  {:else}
    <!-- Expanded Floating Panel -->
    <div class="w-80 md:w-96 bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col overflow-hidden">
      <!-- Panel Header -->
      <div class="p-4 flex items-center justify-between gap-3 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div class="flex flex-col gap-3">
            <h1 class="text-lg font-semibold tracking-tight text-gray-900">Add Building Tool</h1>
            <p class="text-xs text-gray-500">Interactive Polygon Creator</p>
          </div>
        </div>
        <button class="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200" on:click={() => (isOpen = false)}>
          <svg class="w-5 h-5 shrink-0 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tabs Navigation -->
      <div class="flex items-center justify-between gap-3 p-4 border-b border-gray-200">
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 {activeTab === 'generate sections'
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = "generate sections")}
        >
          Generate Sections
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 {activeTab === 'trace perimeter'
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = "trace perimeter")}
        >
          Trace Perimeter
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 {activeTab === 'form'
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = "form")}
        >
          Form
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 {activeTab === 'code'
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = "code")}
        >
          Code
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 relative {activeTab === 'drafts'
            ? 'bg-blue-50 border-blue-300 text-blue-600'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = "drafts")}
        >
          Drafts ({drafts.length})
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="flex flex-col gap-3 p-4 overflow-y-auto max-h-96">
        {#if activeTab === "form"}
          <!-- BUILDING FORM DETAILS -->
          <div class="flex flex-col gap-3">
            <label for="building-id" class="text-xs text-gray-500 font-medium">Building ID (Hex)</label>
            <input
              id="building-id"
              type="text"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-600"
              bind:value={id}
            />

            <label for="building-name" class="text-xs text-gray-500 font-medium">Building Name</label>
            <input
              id="building-name"
              type="text"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              placeholder="e.g. CAS Annex 3"
              bind:value={name}
            />

            <label for="building-type" class="text-xs text-gray-500 font-medium">Building Type</label>
            <select
              id="building-type"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-900"
              bind:value={type}
            >
              {#each Object.values(TYPES) as t}
                <option value={t} class="bg-white text-gray-900">{t}</option>
              {/each}
            </select>

            {#if type === TYPES.ACADEMIC}
              <label for="building-college" class="text-xs text-gray-500 font-medium">College / Department</label>
              <select
                id="building-college"
                class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-900"
                bind:value={college}
              >
                {#each Object.values(COLLEGES) as c}
                  <option value={c} class="bg-white text-gray-900">{c}</option>
                {/each}
              </select>
            {/if}

            <label for="building-alts" class="text-xs text-gray-500 font-medium">Alternate Names (Comma-separated)</label>
            <input
              id="building-alts"
              type="text"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              placeholder="e.g. CAS A3, Annex Three"
              bind:value={alternateNamesStr}
            />

            <label for="building-address" class="text-xs text-gray-500 font-medium">Street Address</label>
            <input
              id="building-address"
              type="text"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              placeholder="e.g. Pedro R Sandoval Ave"
              bind:value={address}
            />

            <div class="bg-white border border-gray-200 rounded-xl p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-lg flex items-center justify-between gap-3">
              <span class="text-xs text-gray-500 font-medium">Centroid Lat/Lng</span>
              <span class="text-sm text-gray-700 font-semibold">{centroid[0]}, {centroid[1]}</span>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="grid gap-3 grid-cols-2">
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-blue-700 disabled:opacity-50"
              disabled={polygonPoints.length < 3}
              on:click={saveDraft}
            >
              {saveStatus}
            </button>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
              on:click={copyCode}
            >
              {copyStatus}
            </button>
          </div>
        {:else if activeTab === "generate sections"}
          <div class="flex flex-col items-center gap-4 w-full">
            {#if $drawBuildingStore.procedure !== "generate_sections"}
              <!-- Initial -->
              <button
                class="flex items-center justify-center rounded-xl w-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                on:click={() => drawBuildingStore.setProcedure("generate_sections")}
              >
                ▶ Start
              </button>
            {:else}
              <!-- Editing -->
              <div class="flex items-center gap-3 w-full">
                <button
                  class="flex items-center justify-center rounded-xl w-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                  on:click={() => drawBuildingStore.removeLastDraftPoint()}
                >
                  ↶ Undo
                </button>

                <button
                  class="flex items-center justify-center rounded-xl w-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                  on:click={() => {
                    drawBuildingStore.commitDraftPointsAsSection();
                    drawBuildingStore.setProcedure("idle");
                  }}
                >
                  ✓ Done
                </button>
              </div>
            {/if}
            <button on:click={() => drawBuildingStore.setShowAllSectionPoints(!$drawBuildingStore.showAllSectionPoints)}
              >{$drawBuildingStore.showAllSectionPoints ? "Hide" : "Show"} All Section Points</button
            >
            <div class="flex flex-col gap-2 w-full">
              <h3>Tools</h3>
              <div class="flex flex-row flex-wrap gap-2">
                {#each drawingTools as tool}
                  <button
                    class=" {selectedDrawingTool === tool.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'} flex items-center justify-center rounded-xl w-full px-5 py-2.5 text-xs transition"
                    on:click={() => (selectedDrawingTool = selectedDrawingTool === tool.value ? null : tool.value)}
                    disabled={$drawBuildingStore.draftPoints.length != 2}
                  >
                    {tool.label}
                  </button>
                {/each}
              </div>
              {#if selectedDrawingTool === "generate_rectangle"}
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label>Width</label>
                <input type="number" placeholder="Width (m)" bind:value={drawingToolParam} />
                <button on:click={generateRectangle}>Save</button>
              {:else if selectedDrawingTool === "generate_right_triangle"}
                <p class="text-xs text-gray-500">
                  <!-- svelte-ignore a11y-label-has-associated-control -->
                  <label>Degrees</label>
                  <input type="number" placeholder="Degrees (m)" bind:value={drawingToolParam} min="1" max="89" />
                </p>
              {:else if selectedDrawingTool === "generate_equally_spaced_points"}
                <p class="text-xs text-gray-500">
                  <!-- svelte-ignore a11y-label-has-associated-control -->
                  <label>Number of Points</label>
                  <input type="number" placeholder="Number of points" bind:value={drawingToolParam} min="1" max="89" />
                  <button on:click={handleGenerateEquallySpacedPoints}>Save</button>
                </p>
              {:else if selectedDrawingTool === "generate_points_along_segment"}
                <p class="text-xs text-gray-500">
                  <!-- svelte-ignore a11y-label-has-associated-control -->
                  <label>Point Distance</label>
                  {console.log($drawBuildingStore.sections)}
                  <input type="number" placeholder="0.50" bind:value={drawingToolParam} min="0.01" max="0.99" />
                  <button on:click={handleGeneratePointsAlongSegment}>Save</button>
                </p>
              {/if}
            </div>
            <div class="flex flex-col gap-2 w-full">
              <h3 class="text-lg font-semibold">Building Sections</h3>

              {#if $drawBuildingStore.sections.length === 0}
                <p class="text-sm text-gray-500">No sections drawn yet.</p>
              {/if}

              <ul class="flex flex-col gap-2">
                {#each $drawBuildingStore.sections as section}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                  <li
                    class="flex cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white p-3 transition-all hover:border-gray-400"
                    class:border-amber-400={$drawBuildingStore.selectedSectionId === section.id}
                    class:bg-amber-50={$drawBuildingStore.selectedSectionId === section.id}
                    class:ring-2={$drawBuildingStore.selectedSectionId === section.id}
                    class:ring-amber-200={$drawBuildingStore.selectedSectionId === section.id}
                    on:click={() => drawBuildingStore.setSelectedSection(section.id)}
                  >
                    <div class="flex flex-col">
                      <strong class="font-semibold">{section.id}</strong>
                      <span class="text-xs text-gray-500">
                        Vertices: {section.polygon.length}
                      </span>
                    </div>

                    <button
                      class="cursor-pointer border-0 bg-transparent text-lg opacity-50 transition hover:text-red-500 hover:opacity-100"
                      on:click|stopPropagation={() => drawBuildingStore.deleteSection(section.id)}
                    >
                      <Trash size={16} />
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {:else if activeTab === "trace perimeter"}
          <div>
            {`         user will choose what to trace (either the building or the rooms)
          after tracing the user must place the required metadata (for the building, the metadata to insert is in the "form" activeTab (the form activeTab should be now deleted, since trace perimeter under building is now under it))
          the required metedata for rooms is 
export interface IRoom {
  name: string;
  code: string;
  alternateNames: string[];
  polygon: [number, number][];
  roomType: ROOM_TYPES;
}

export enum ROOM_TYPES {
  ACADEMIC = "Academic Room",
  FACULTY = "Faculty Room",
  ADMIN = "Administrative Room",
  LABORATORY = "Laboratory",
  LECTURE_HALL = "Lecture Hall",
  DORM = "Dorm Room",
  CR = "Comfort Room CR",
}`}
          </div>
        {:else if activeTab === "code"}
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-gray-700 font-semibold">Generated TS Code</span>
              <button
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                on:click={copyCode}
              >
                {copyStatus}
              </button>
            </div>
            <div class="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-700 overflow-auto whitespace-pre max-h-96 leading-relaxed">
              {codeBlock}
            </div>
            <div class="text-xs text-gray-500 leading-normal bg-blue-50 border border-blue-300 rounded-xl p-4">
              <b class="text-blue-600 font-semibold">How to use:</b> Add points on the map, edit metadata, then copy this block and insert it inside the <code class="text-gray-700">buildings</code>
              array in <code class="text-gray-700">src/data/buildings.ts</code>.
            </div>
          </div>
        {:else if activeTab === "drafts"}
          <div class="flex flex-col gap-3">
            {#if drafts.length === 0}
              <div class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 text-center">
                <span class="text-sm text-gray-700">No buildings drafted yet.</span>
                <span class="text-xs text-gray-500">Complete a polygon and click "Save Draft" to add them to this session list.</span>
              </div>
            {:else}
              <div class="flex items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <span class="text-sm text-gray-700 font-semibold">Session Drafts ({drafts.length})</span>
                <div class="flex items-center justify-between gap-3">
                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-blue-700"
                    on:click={copyAllDraftsCode}
                  >
                    Copy All ({drafts.length})
                  </button>
                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200 hover:text-red-500"
                    on:click={clearAllDrafts}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div class="flex flex-col divide-y divide-gray-200">
                {#each drafts as draft}
                  <div class="flex items-center justify-between gap-3 p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div class="flex flex-col gap-3">
                      <div class="flex items-center gap-3">
                        <span class="text-sm text-gray-700 font-semibold">{draft.name}</span>
                        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 border border-blue-300 text-blue-600">{draft.id}</span>
                      </div>
                      <div class="grid grid-cols-2 gap-3 text-xs text-gray-500">
                        <div>Type: <span class="text-gray-700 font-medium">{draft.type}</span></div>
                        <div>Vertices: <span class="text-gray-700 font-medium">{draft.polygon.length}</span></div>
                        <div class="col-span-2 truncate">Address: <span class="text-gray-700 font-medium">{draft.address}</span></div>
                      </div>
                    </div>
                    <button
                      class="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200 text-blue-600 text-xs font-medium"
                      on:click={() => navigator.clipboard.writeText(draft.code)}
                      title="Copy"
                    >
                      Copy
                    </button>
                  </div>
                {/each}
              </div>

              <div class="text-xs text-gray-500 leading-normal bg-blue-50 border border-blue-300 rounded-xl p-4">
                Previews of these drafted buildings are drawn on the map as dashed blue polygon overlays so you can review their sizes and alignments relative to other structures.
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
