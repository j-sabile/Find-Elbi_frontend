<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import L from "leaflet";
  import { elbiMap } from "../stores/map";
  import { TYPES, COLLEGES } from "../data/constants";
  import buildings from "../data/buildings";
  import { calculatePolygonArea, calculatePolygonPerimeter } from "../utils/gisConvert";

  // State
  let isOpen = true;
  let isDrawing = false;
  let activeTab: "form" | "code" | "drafts" = "form";

  // Form Fields
  let id = "";
  let name = "";
  let type = TYPES.ACADEMIC;
  let college = COLLEGES.CAS;
  let alternateNamesStr = "";
  let address = "";
  
  // Polygon State
  let polygonPoints: [number, number][] = [];
  
  // Leaflet Layer References
  let polygonLayer: L.Polygon | null = null;
  let vertexMarkers: L.Marker[] = [];
  let centroidMarker: L.Marker | null = null;
  
  // Saved drafts for this session
  let drafts: any[] = [];
  let draftLayers: L.FeatureGroup | null = null;

  // Notification / Copy state
  let copyStatus = "Copy Code";
  let saveStatus = "Save Draft";
  
  // Initialize
  onMount(() => {
    id = getNextId();
    if ($elbiMap) {
      draftLayers = L.featureGroup().addTo($elbiMap);
    }
  });

  onDestroy(() => {
    deactivateDrawing();
    clearDrawLayers();
    if (draftLayers && $elbiMap) {
      draftLayers.removeFrom($elbiMap);
    }
  });

  // Calculate next hexadecimal ID (e.g. 001E)
  function getNextId(): string {
    // Collect all IDs from buildings array + current session drafts
    const allIds = [...buildings.map(b => b.id), ...drafts.map(d => d.id)];
    let maxVal = 0;
    allIds.forEach((idStr) => {
      const val = parseInt(idStr, 16);
      if (!isNaN(val) && val > maxVal) {
        maxVal = val;
      }
    });
    return (maxVal + 1).toString(16).toUpperCase().padStart(4, "0");
  }

  // Handle Map clicks when in drawing mode
  function handleMapClick(e: L.LeafletMouseEvent) {
    if (!isDrawing) return;
    const lat = parseFloat(e.latlng.lat.toFixed(6));
    const lng = parseFloat(e.latlng.lng.toFixed(6));
    
    polygonPoints = [...polygonPoints, [lat, lng]];
    
    // Create draggable marker for new vertex
    const index = polygonPoints.length - 1;
    const marker = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({
        className: "custom-vertex-icon",
        html: `<div class="w-5 h-5 bg-blue-600 border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-[10px] font-semibold text-white hover:bg-blue-700 transition-colors cursor-move">${index + 1}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    });
    
    // Update polygon coords in real-time when dragging
    marker.on("drag", (evt: L.LeafletEvent) => {
      const target = evt.target as L.Marker;
      const newLatLng = target.getLatLng();
      polygonPoints[index] = [
        parseFloat(newLatLng.lat.toFixed(6)),
        parseFloat(newLatLng.lng.toFixed(6))
      ];
      polygonPoints = [...polygonPoints];
      redrawLayers();
    });

    marker.on("dragend", () => {
      polygonPoints = [...polygonPoints];
      redrawLayers();
    });
    
    if ($elbiMap) {
      marker.addTo($elbiMap);
    }
    vertexMarkers.push(marker);
    
    redrawLayers();
  }

  function redrawLayers() {
    if (!$elbiMap) return;
    
    // 1. Draw/Update Polygon
    if (polygonPoints.length >= 2) {
      if (!polygonLayer) {
        polygonLayer = L.polygon(polygonPoints, {
          color: "#2563eb", // blue-600
          fillColor: "#2563eb",
          fillOpacity: 0.15,
          weight: 3,
        }).addTo($elbiMap);
      } else {
        polygonLayer.setLatLngs(polygonPoints);
      }
    } else {
      if (polygonLayer) {
        polygonLayer.removeFrom($elbiMap);
        polygonLayer = null;
      }
    }
    
    // 2. Draw/Update Centroid
    if (polygonPoints.length > 0) {
      const cent = getCentroid(polygonPoints);
      if (!centroidMarker) {
        centroidMarker = L.marker(cent, {
          icon: L.divIcon({
            className: "custom-centroid-icon",
            html: `<div class="w-5 h-5 bg-blue-50 border border-blue-300 rounded-full shadow-lg flex items-center justify-center text-[10px] font-semibold text-blue-600 hover:scale-110 transition-transform">C</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        })
        .bindTooltip("Calculated Centroid (Marker Position)", { direction: "top" })
        .addTo($elbiMap);
      } else {
        centroidMarker.setLatLng(cent);
      }
    } else {
      if (centroidMarker) {
        centroidMarker.removeFrom($elbiMap);
        centroidMarker = null;
      }
    }
  }

  function getCentroid(pts: [number, number][]): [number, number] {
    if (pts.length === 0) return [0, 0];
    let latSum = 0;
    let lngSum = 0;
    pts.forEach(([lat, lng]) => {
      latSum += lat;
      lngSum += lng;
    });
    return [
      parseFloat((latSum / pts.length).toFixed(6)),
      parseFloat((lngSum / pts.length).toFixed(6))
    ];
  }

  function toggleDrawing() {
    if (isDrawing) {
      deactivateDrawing();
    } else {
      activateDrawing();
    }
  }

  function activateDrawing() {
    if (!$elbiMap) return;
    isDrawing = true;
    $elbiMap.getContainer().style.cursor = "crosshair";
    $elbiMap.on("click", handleMapClick);
  }

  function deactivateDrawing() {
    if (!$elbiMap) return;
    isDrawing = false;
    $elbiMap.getContainer().style.cursor = "";
    $elbiMap.off("click", handleMapClick);
  }

  function clearDrawLayers() {
    if (polygonLayer) {
      polygonLayer.removeFrom($elbiMap);
      polygonLayer = null;
    }
    if (centroidMarker) {
      centroidMarker.removeFrom($elbiMap);
      centroidMarker = null;
    }
    vertexMarkers.forEach((m) => m.removeFrom($elbiMap));
    vertexMarkers = [];
  }

  // Undo the last drawn vertex point
  function handleUndo() {
    if (polygonPoints.length === 0) return;
    polygonPoints.pop();
    polygonPoints = [...polygonPoints];
    
    const m = vertexMarkers.pop();
    if (m) m.removeFrom($elbiMap);
    
    // Re-index remaining markers HTML content
    vertexMarkers.forEach((marker, idx) => {
      marker.setIcon(L.divIcon({
        className: "custom-vertex-icon",
        html: `<div class="w-5 h-5 bg-blue-600 border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-[10px] font-semibold text-white hover:bg-blue-700 transition-colors cursor-move">${idx + 1}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      }));
    });
    
    redrawLayers();
  }

  function handleClear() {
    polygonPoints = [];
    clearDrawLayers();
  }

  // Reactive variables for details
  $: centroid = getCentroid(polygonPoints);
  $: area = calculatePolygonArea(polygonPoints);
  $: perimeter = calculatePolygonPerimeter(polygonPoints);
  
  // Format Alternate Names
  $: alternateNames = alternateNamesStr
    .split(",")
    .map(s => s.trim())
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
    polygonPtsVal: [number, number][]
  ): string {
    const isAcademic = typeVal === TYPES.ACADEMIC;
    
    const formattedAlts = altNamesVal.length > 0 
      ? `[${altNamesVal.map(n => `"${n}"`).join(", ")}]`
      : "[]";

    const formattedPolygon = polygonPtsVal.length > 0
      ? `[\n${polygonPtsVal.map(p => `      [${p[0]}, ${p[1]}]`).join(",\n")}\n    ]`
      : "[]";

    return `  {
    id: "${idVal}",
    name: "${nameVal || "Unnamed Building"}",
    type: TYPES.${Object.keys(TYPES).find(k => TYPES[k as keyof typeof TYPES] === typeVal) || "ACADEMIC"},
${isAcademic ? `    college: COLLEGES.${Object.keys(COLLEGES).find(k => COLLEGES[k as keyof typeof COLLEGES] === collegeVal) || "CAS"},\n` : ""}    alternateNames: ${formattedAlts},
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

    const draft = {
      id,
      name: name || "Unnamed Building",
      type,
      college: type === TYPES.ACADEMIC ? college : undefined,
      alternateNames,
      address: address || "Unknown Road",
      marker: centroid,
      polygon: [...polygonPoints],
      code: codeBlock
    };

    drafts = [...drafts, draft];

    // Add to preview layers on map
    if ($elbiMap && draftLayers) {
      const pLayer = L.polygon(draft.polygon, {
        color: "#2563eb", // blue-600
        fillColor: "#2563eb",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "4 4"
      });
      
      const mLayer = L.marker(draft.marker, {
        icon: L.divIcon({
          className: "custom-draft-icon",
          html: `<div class="w-5 h-5 bg-blue-500 border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-[10px] font-semibold text-white">D</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).bindTooltip(`<b>${draft.name}</b> (Draft ${draft.id})<br>${draft.type}`, { direction: "top" });

      const group = L.featureGroup([pLayer, mLayer]).addTo(draftLayers);
      draftLayers.addLayer(group);
    }

    // Reset for next building, maintaining drawing status
    name = "";
    alternateNamesStr = "";
    address = "";
    polygonPoints = [];
    clearDrawLayers();
    
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
    const allCode = drafts.map(d => d.code).join("\n\n");
    navigator.clipboard.writeText(allCode).then(() => {
      alert("All drafted buildings code copied to clipboard!");
    });
  }

  // Subscribe to map initialization
  $: if ($elbiMap && !draftLayers) {
    draftLayers = L.featureGroup().addTo($elbiMap);
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
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 {activeTab === 'form' ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = 'form')}
        >
          Form
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 {activeTab === 'code' ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = 'code')}
        >
          Code
        </button>
        <button
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 relative {activeTab === 'drafts' ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}"
          on:click={() => (activeTab = 'drafts')}
        >
          Drafts ({drafts.length})
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="flex flex-col gap-3 p-4 overflow-y-auto max-h-96">

        {#if activeTab === 'form'}
          <!-- DRAWING CONTROLS -->
          <div class="bg-white border border-gray-200 rounded-xl p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-lg flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-gray-700 font-semibold">Map Drawing</span>
              <span class="text-xs text-gray-500 {isDrawing ? 'text-blue-600' : ''}">
                {isDrawing ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div class="grid gap-3 grid-cols-2">
              <button
                class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 {isDrawing ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'bg-blue-600 text-white hover:bg-blue-700'}"
                on:click={toggleDrawing}
              >
                {isDrawing ? 'Stop' : 'Start'}
              </button>
              <button
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                disabled={polygonPoints.length === 0}
                on:click={handleUndo}
              >
                Undo
              </button>
            </div>
            
            <div class="flex items-center justify-between gap-3 border-t border-gray-200 pt-3 text-xs text-gray-500">
              <span>Points: <b class="text-gray-700 font-semibold">{polygonPoints.length}</b></span>
              <span>Area: <b class="text-gray-700 font-semibold">{area.toFixed(1)} m²</b></span>
              <button
                class="text-gray-700 hover:text-red-500 font-medium disabled:opacity-50"
                disabled={polygonPoints.length === 0}
                on:click={handleClear}
              >
                Clear
              </button>
            </div>
          </div>

          <!-- BUILDING FORM DETAILS -->
          <div class="flex flex-col gap-3">
            <!-- ID Field (Auto generated) -->
            <label for="building-id" class="text-xs text-gray-500 font-medium">Building ID (Hex)</label>
            <input
              id="building-id"
              type="text"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-600"
              bind:value={id}
            />

            <!-- Name -->
            <label for="building-name" class="text-xs text-gray-500 font-medium">Building Name</label>
            <input
              id="building-name"
              type="text"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              placeholder="e.g. CAS Annex 3"
              bind:value={name}
            />

            <!-- Type -->
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

            <!-- College (Conditionally Shown) -->
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

            <!-- Alternate Names -->
            <label for="building-alts" class="text-xs text-gray-500 font-medium">Alternate Names (Comma-separated)</label>
            <input
              id="building-alts"
              type="text"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              placeholder="e.g. CAS A3, Annex Three"
              bind:value={alternateNamesStr}
            />

            <!-- Address -->
            <label for="building-address" class="text-xs text-gray-500 font-medium">Street Address</label>
            <input
              id="building-address"
              type="text"
              class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              placeholder="e.g. Pedro R Sandoval Ave"
              bind:value={address}
            />

            <!-- Calculated Centroid -->
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

        {:else}
          <!-- VIEW CODE TAB -->
          {#if activeTab === 'code'}
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
                <b class="text-blue-600 font-semibold">How to use:</b> Add points on the map, edit metadata, then copy this block and insert it inside the <code class="text-gray-700">buildings</code> array in <code class="text-gray-700">src/data/buildings.ts</code>.
              </div>
            </div>

          <!-- DRAFTS TAB -->
          {:else if activeTab === 'drafts'}
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
                  {#each drafts as draft, index}
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
        {/if}

      </div>
      
    </div>
  {/if}
</div>

<style>
  :global(.custom-vertex-icon) {
    background: transparent !important;
    border: none !important;
  }
  :global(.custom-centroid-icon) {
    background: transparent !important;
    border: none !important;
  }
  :global(.custom-draft-icon) {
    background: transparent !important;
    border: none !important;
  }
</style>