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
        html: `<div class="w-5 h-5 bg-emerald-400 border-2 border-slate-900 rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold text-slate-950 hover:bg-emerald-300 transition-colors cursor-move">${index + 1}</div>`,
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
          color: "#10b981", // Emerald-500
          fillColor: "#10b981",
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
            html: `<div class="w-5 h-5 bg-amber-500 border-2 border-slate-900 rounded-full shadow-xl flex items-center justify-center text-[10px] font-black text-white hover:scale-110 transition-transform">C</div>`,
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
        html: `<div class="w-5 h-5 bg-emerald-400 border-2 border-slate-900 rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold text-slate-950 hover:bg-emerald-300 transition-colors cursor-move">${idx + 1}</div>`,
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
        color: "#6366f1", // Indigo color for drafts
        fillColor: "#6366f1",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "4 4"
      });
      
      const mLayer = L.marker(draft.marker, {
        icon: L.divIcon({
          className: "custom-draft-icon",
          html: `<div class="w-4 h-4 bg-indigo-500 border border-white rounded-full shadow-lg flex items-center justify-center text-[8px] font-bold text-white font-mono">D</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
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
<div class="absolute top-4 left-4 z-[1000] flex flex-col pointer-events-auto max-h-[calc(100vh-6rem)] md:max-h-[calc(100vh-4rem)] select-none">
  {#if !isOpen}
    <!-- Collapsed Toggle Button -->
    <button
      class="bg-slate-900 border border-slate-800 text-white rounded-lg shadow-2xl p-3 flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-105"
      on:click={() => (isOpen = true)}
      title="Open Building Adder Tool"
    >
      <svg class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  {:else}
    <!-- Expanded Floating Panel -->
    <div class="w-80 md:w-96 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-lg flex flex-col overflow-hidden text-slate-200 max-h-[75vh]">
      
      <!-- Panel Header -->
      <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <h1 class="text-xs font-bold uppercase tracking-wider text-slate-100">Add Building Tool</h1>
            <p class="text-[9px] text-slate-400">Interactive Polygon Creator</p>
          </div>
        </div>
        <button class="text-slate-400 hover:text-white transition-colors" on:click={() => (isOpen = false)}>
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tabs Navigation -->
      <div class="flex bg-slate-900/50 border-b border-slate-800 text-xs font-semibold">
        <button
          class="flex-1 py-2 text-center border-b-2 transition-all {activeTab === 'form' ? 'text-emerald-400 border-emerald-400 bg-slate-900/30' : 'text-slate-400 border-transparent hover:text-slate-200'}"
          on:click={() => (activeTab = 'form')}
        >
          Form Details
        </button>
        <button
          class="flex-1 py-2 text-center border-b-2 transition-all {activeTab === 'code' ? 'text-emerald-400 border-emerald-400 bg-slate-900/30' : 'text-slate-400 border-transparent hover:text-slate-200'}"
          on:click={() => (activeTab = 'code')}
        >
          View Code
        </button>
        <button
          class="flex-1 py-2 text-center border-b-2 transition-all relative {activeTab === 'drafts' ? 'text-emerald-400 border-emerald-400 bg-slate-900/30' : 'text-slate-400 border-transparent hover:text-slate-200'}"
          on:click={() => (activeTab = 'drafts')}
        >
          Drafts ({drafts.length})
          {#if drafts.length > 0}
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
          {/if}
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="flex-grow overflow-y-auto p-4 flex flex-col gap-4 text-xs max-h-[55vh]">

        {#if activeTab === 'form'}
          <!-- DRAWING CONTROLS -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-300">Map Drawing Controls</span>
              <span class="text-[10px] font-mono {isDrawing ? 'text-emerald-400' : 'text-slate-500'}">
                ● {isDrawing ? 'DRAWING ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <button
                class="py-2 px-3 rounded font-bold transition-all border {isDrawing ? 'bg-amber-600/30 border-amber-500 text-amber-300 hover:bg-amber-600/40' : 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30'}"
                on:click={toggleDrawing}
              >
                {isDrawing ? 'Stop Drawing' : 'Start Drawing'}
              </button>
              <button
                class="py-2 px-3 rounded font-bold bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 text-slate-300 disabled:opacity-50"
                disabled={polygonPoints.length === 0}
                on:click={handleUndo}
              >
                Undo Point
              </button>
            </div>
            
            <div class="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-800 pt-2">
              <span>Points: <b>{polygonPoints.length}</b></span>
              <span>Area: <b>{area.toFixed(1)} m²</b></span>
              <button
                class="text-red-400 hover:text-red-300 font-semibold disabled:opacity-50"
                disabled={polygonPoints.length === 0}
                on:click={handleClear}
              >
                Clear Polygon
              </button>
            </div>
          </div>

          <!-- BUILDING FORM DETAILS -->
          <div class="flex flex-col gap-3">
            <!-- ID Field (Auto generated) -->
            <div class="flex flex-col gap-1">
              <label for="building-id" class="text-slate-400 font-semibold">Building ID (Hex)</label>
              <input
                id="building-id"
                type="text"
                class="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none font-mono text-emerald-400 font-bold"
                bind:value={id}
              />
            </div>

            <!-- Name -->
            <div class="flex flex-col gap-1">
              <label for="building-name" class="text-slate-400 font-semibold">Building Name</label>
              <input
                id="building-name"
                type="text"
                class="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none text-slate-100"
                placeholder="e.g. CAS Annex 3"
                bind:value={name}
              />
            </div>

            <!-- Type -->
            <div class="flex flex-col gap-1">
              <label for="building-type" class="text-slate-400 font-semibold">Building Type</label>
              <select
                id="building-type"
                class="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none cursor-pointer text-slate-100 font-sans"
                bind:value={type}
              >
                {#each Object.values(TYPES) as t}
                  <option value={t} class="bg-slate-900 text-slate-100">{t}</option>
                {/each}
              </select>
            </div>

            <!-- College (Conditionally Shown) -->
            {#if type === TYPES.ACADEMIC}
              <div class="flex flex-col gap-1">
                <label for="building-college" class="text-slate-400 font-semibold">College / Department</label>
                <select
                  id="building-college"
                  class="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none cursor-pointer text-slate-100 font-sans"
                  bind:value={college}
                >
                  {#each Object.values(COLLEGES) as c}
                    <option value={c} class="bg-slate-900 text-slate-100">{c}</option>
                  {/each}
                </select>
              </div>
            {/if}

            <!-- Alternate Names -->
            <div class="flex flex-col gap-1">
              <label for="building-alts" class="text-slate-400 font-semibold">Alternate Names (Comma-separated)</label>
              <input
                id="building-alts"
                type="text"
                class="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none text-slate-100"
                placeholder="e.g. CAS A3, Annex Three"
                bind:value={alternateNamesStr}
              />
            </div>

            <!-- Address -->
            <div class="flex flex-col gap-1">
              <label for="building-address" class="text-slate-400 font-semibold">Street Address</label>
              <input
                id="building-address"
                type="text"
                class="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none text-slate-100"
                placeholder="e.g. Pedro R Sandoval Ave"
                bind:value={address}
              />
            </div>

            <!-- Calculated Centroid -->
            <div class="bg-slate-900/40 border border-slate-800/60 rounded p-2.5 text-[11px] font-mono flex justify-between items-center mt-1">
              <span class="text-slate-500 font-semibold">Centroid Lat/Lng:</span>
              <span class="text-slate-300 font-bold">{centroid[0]}, {centroid[1]}</span>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="flex gap-2 mt-2 pt-2 border-t border-slate-800">
            <button
              class="flex-1 py-2 px-3 rounded font-bold bg-indigo-600 hover:bg-indigo-500 transition-colors border border-indigo-500 text-white disabled:opacity-50"
              disabled={polygonPoints.length < 3}
              on:click={saveDraft}
            >
              {saveStatus}
            </button>
            <button
              class="flex-1 py-2 px-3 rounded font-bold bg-emerald-600 hover:bg-emerald-500 transition-colors border border-emerald-500 text-slate-950"
              on:click={copyCode}
            >
              {copyStatus}
            </button>
          </div>

        {:else}
          <!-- VIEW CODE TAB -->
          {#if activeTab === 'code'}
            <div class="flex flex-col gap-3 h-full">
              <div class="flex justify-between items-center">
                <span class="text-slate-400 font-semibold">Generated TS Code Object</span>
                <button
                  class="px-2 py-1 bg-slate-800 hover:bg-slate-700 transition-all rounded text-[10px] text-emerald-400 font-bold border border-slate-700"
                  on:click={copyCode}
                >
                  {copyStatus}
                </button>
              </div>
              <div class="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[10px] overflow-auto select-text select-all whitespace-pre max-h-[40vh] text-emerald-300/90 leading-relaxed tab-size-2">
                {codeBlock}
              </div>
              <div class="text-[10px] text-slate-400 leading-normal bg-slate-900/40 p-2.5 rounded border border-slate-800/50">
                💡 <b>How to use:</b> Add points on the map, edit metadata, then copy this block and insert it inside the <code>buildings</code> array in <code>src/data/buildings.ts</code>.
              </div>
            </div>

          <!-- DRAFTS TAB -->
          {:else if activeTab === 'drafts'}
            <div class="flex flex-col gap-3 h-full">
              {#if drafts.length === 0}
                <div class="text-center py-8 text-slate-500">
                  No buildings drafted yet.
                  <p class="text-[10px] mt-1">Complete a polygon and click "Save Draft" to add them to this session list.</p>
                </div>
              {:else}
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span class="text-slate-400 font-semibold">Session Drafts ({drafts.length})</span>
                  <div class="flex gap-2">
                    <button
                      class="px-2 py-1 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40 transition-colors rounded text-[10px] font-bold"
                      on:click={copyAllDraftsCode}
                    >
                      Copy All ({drafts.length})
                    </button>
                    <button
                      class="px-2 py-1 bg-red-600/20 text-red-400 border border-red-500/20 hover:bg-red-600/30 transition-colors rounded text-[10px] font-bold"
                      on:click={clearAllDrafts}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div class="flex flex-col gap-2 overflow-y-auto max-h-[35vh] pr-1">
                  {#each drafts as draft, index}
                    <div class="bg-slate-900 border border-slate-800 rounded p-2.5 flex flex-col gap-1.5 relative group hover:border-slate-700 transition-colors">
                      <div class="flex justify-between items-start">
                        <div>
                          <span class="font-bold text-slate-200">{draft.name}</span>
                          <span class="text-[10px] font-mono bg-slate-800 text-slate-400 px-1 rounded ml-1.5">{draft.id}</span>
                        </div>
                        <button
                          class="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[9px] font-semibold text-emerald-400 transition-colors"
                          on:click={() => navigator.clipboard.writeText(draft.code)}
                        >
                          Copy
                        </button>
                      </div>
                      <div class="grid grid-cols-2 gap-x-2 text-[10px] text-slate-400 leading-normal">
                        <div>Type: <span class="text-slate-300">{draft.type}</span></div>
                        <div>Vertices: <span class="text-slate-300">{draft.polygon.length}</span></div>
                        <div class="col-span-2 truncate">Address: <span class="text-slate-300">{draft.address}</span></div>
                      </div>
                    </div>
                  {/each}
                </div>
                
                <div class="text-[10px] text-slate-400 leading-normal bg-indigo-950/20 p-2.5 rounded border border-indigo-900/30">
                  ℹ️ Previews of these drafted buildings are drawn on the map as dashed indigo polygon overlays so you can review their sizes and alignments relative to other structures.
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
  .tab-size-2 {
    tab-size: 2;
    -moz-tab-size: 2;
  }
</style>
