<script lang="ts">
  export let classes = "";
  import { gisStoreV2 } from "../stores/gisV2";
  import { mapInstance, mapSettings } from "../stores/mapV2";
  import L, { type TileLayer, type CircleMarker, type Polyline, type Polygon, type Circle } from "leaflet";
  import buildings from "../data/buildings";
  import { getHaversineDistance, calculatePolygonArea, calculatePolygonPerimeter } from "../utils/gisConvert";
  import { CAMPUS_BOUNDARY, DEFAULT_MAP_SETTINGS } from "../data/constants";

  // ─── Basemap management ──────────────────────────────────────────────────────
  let currentBasemap: TileLayer | undefined;
  $: {
    if ($mapInstance && $mapSettings.activeBasemap !== currentBasemap) {
      if (currentBasemap) $mapInstance.removeLayer(currentBasemap);
      currentBasemap = $mapSettings.activeBasemap;
      currentBasemap.addTo($mapInstance);
    }
  }

  // ─── Map initialization ──────────────────────────────────────────────────────
  function createMap(container: HTMLElement) {
    const map = L.map(container, {
      zoomControl: false,
      preferCanvas: true,
      maxZoom: DEFAULT_MAP_SETTINGS.maxZoom,
      minZoom: DEFAULT_MAP_SETTINGS.minZoom,
    }).setView(DEFAULT_MAP_SETTINGS.center, DEFAULT_MAP_SETTINGS.initialZoom);
    mapInstance.set(map);

    L.polyline(CAMPUS_BOUNDARY, { color: "#ef4444", weight: 2, dashArray: "8 6", opacity: 0.8 }).bindTooltip("UPLB Campus Boundary", { sticky: true, opacity: 0.8 }).addTo(map);
    // L.control.scale({ position: "topright", metric: true, imperial: false }).addTo(map);
    // L.control.zoom({ position: "topright" }).addTo(map);

    $mapSettings.activeBasemap.addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => handleMapClick(e.latlng.lat, e.latlng.lng));

    // DISABLED: To be enabled once UI for mouse coordinates is implemented
    // map.on("mousemove", (e: L.LeafletMouseEvent) => mouseLatLng.set({ lat: e.latlng.lat, lng: e.latlng.lng }));
    // map.on("mouseout", () => mouseLatLng.set(null));

    return {
      destroy() {
        map.off(); // Remove leaflet event listeners
        map.remove(); // Destroy the Leaflet instance safely
        mapInstance.set(null); // Clear the Svelte store
      },
    };
  }

  // ─── Unified Map Click Handler ────────────────────────────────────────────────
  function handleMapClick(lat: number, lng: number) {
    const tool = $gisStoreV2.activeTool;
    if (tool === "buffer") runBufferQuery(lat, lng);
    else if (tool === "nearest") runNearestFacility(lat, lng);
    else if (tool === "measure_dist" || tool === "measure_area") addMeasurementPoint(lat, lng);
    else if (tool === "draw_building") gisStoreV2.addPoint([lat, lng]);
  }

  // ─── Overlay layer collections ───────────────────────────────────────────────
  let centroidMarkers: CircleMarker[] = [];
  let boundaryPolyline: Polyline | undefined;
  let gridLines: Polyline[] = [];
  let bufferCircle: Circle | undefined;
  let bufferMarkers: CircleMarker[] = [];
  let nearestLine: Polyline | undefined;
  let nearestOriginMarker: CircleMarker | undefined;
  let nearestDestMarker: CircleMarker | undefined;
  let measureLine: Polyline | undefined;
  let measurePolygon: Polygon | undefined;
  let measureNodes: CircleMarker[] = [];

  // ─── Add Building overlay ───────────────────────────────────────────────────
  let buildingPolygon: Polygon | undefined;
  let buildingCentroid: CircleMarker | undefined;
  let buildingNodes: CircleMarker[] = [];

  // ─── Overlay: Building Centroids ─────────────────────────────────────────────
  function drawCentroids() {
    const map = $mapInstance; // lock the value into const variable, $mapInstance is a mutable variable and can change between reactive updates
    if (map == null) return;
    centroidMarkers.forEach((m) => m.removeFrom(map));
    centroidMarkers = [];
    buildings.forEach((building) => {
      const lats = building.polygon.map((p) => p[0]);
      const lngs = building.polygon.map((p) => p[1]);
      const lat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      const m = L.circleMarker([lat, lng], {
        radius: 3,
        color: "#f59e0b",
        fillColor: "#f59e0b",
        fillOpacity: 0.9,
        weight: 1,
      })
        .bindTooltip(`${building.name} (centroid)`, { direction: "top", opacity: 0.85 })
        .addTo(map);
      centroidMarkers.push(m);
    });
  }

  function removeCentroids() {
    const map = $mapInstance; // lock the value into const variable, $mapInstance is a mutable variable and can change between reactive updates
    if (map == null) return;
    centroidMarkers.forEach((m) => m.removeFrom(map));
    centroidMarkers = [];
  }

  // ─── Overlay: UTM Grid Lines ─────────────────────────────────────────────────
  function drawGrid() {
    if (!$mapInstance) return;
    removeGrid();
    const bounds = $mapInstance.getBounds();
    const STEP = 0.001; // ~111m spacing

    const minLat = Math.floor(bounds.getSouth() / STEP) * STEP;
    const maxLat = Math.ceil(bounds.getNorth() / STEP) * STEP;
    const minLng = Math.floor(bounds.getWest() / STEP) * STEP;
    const maxLng = Math.ceil(bounds.getEast() / STEP) * STEP;

    const gridStyle = { color: "#3b82f6", weight: 0.5, opacity: 0.35, dashArray: "2 4" };

    // Horizontal lines (constant lat)
    for (let lat = minLat; lat <= maxLat; lat = Math.round((lat + STEP) * 10000) / 10000) {
      gridLines.push(
        L.polyline(
          [
            [lat, minLng],
            [lat, maxLng],
          ],
          gridStyle,
        ).addTo($mapInstance),
      );
    }
    // Vertical lines (constant lng)
    for (let lng = minLng; lng <= maxLng; lng = Math.round((lng + STEP) * 10000) / 10000) {
      gridLines.push(
        L.polyline(
          [
            [minLat, lng],
            [maxLat, lng],
          ],
          gridStyle,
        ).addTo($mapInstance),
      );
    }
  }

  function removeGrid() {
    const map = $mapInstance; // lock the value into const variable, $mapInstance is a mutable variable and can change between reactive updates
    if (map == null) return;
    gridLines.forEach((l) => l.removeFrom(map));
    gridLines = [];
  }

  // ─── GIS Tool: Buffer Query ──────────────────────────────────────────────────
  function runBufferQuery(lat: number, lng: number) {
    const map = $mapInstance; // lock the value into const variable, $mapInstance is a mutable variable and can change between reactive updates
    if (map == null) return;
    clearBuffer();

    const radius = $gisStoreV2.bufferRadius;
    bufferCircle = L.circle([lat, lng], {
      radius,
      color: "#38bdf8",
      fillColor: "#38bdf8",
      fillOpacity: 0.08,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    gisStoreV2.executeBufferQuery([lat, lng]);

    // Find all buildings within the buffer radius
    const results = buildings
      .map((b) => ({ building: b, distance: getHaversineDistance([lat, lng], b.marker) }))
      .filter((r) => r.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    // Highlight matched buildings with markers
    bufferMarkers = results.map((r) =>
      L.circleMarker(r.building.marker, {
        radius: 6,
        color: "#38bdf8",
        fillColor: "#38bdf8",
        fillOpacity: 0.7,
        weight: 2,
      })
        .bindTooltip(`${r.building.name} — ${r.distance.toFixed(0)}m`, { direction: "top" })
        .addTo(map),
    );
  }

  function clearBuffer() {
    const map = $mapInstance; // lock the value into const variable, $mapInstance is a mutable variable and can change between reactive updates
    if (map == null) return;
    if (bufferCircle) {
      bufferCircle.removeFrom(map);
      bufferCircle = undefined;
    }
    bufferMarkers.forEach((m) => m.removeFrom(map));
    bufferMarkers = [];
  }

  // ─── GIS Tool: Nearest Facility ──────────────────────────────────────────────
  function runNearestFacility(lat: number, lng: number) {
    if (!$mapInstance) return;
    clearNearest();

    gisStoreV2.executeNearestQuery([lat, lng]);
    const stored = $gisStoreV2.nearestResult;
    if (!stored) return;
    const building = buildings.find((b) => b.id === stored.buildingId);
    if (!building) return;

    const result = { building, distance: stored.distance };
    const walkingTimeMin = stored.walkingTimeMin;

    // Draw origin marker (pulsing look via CSS class)
    nearestOriginMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: "#f59e0b",
      fillColor: "#fef3c7",
      fillOpacity: 1,
      weight: 2.5,
    })
      .bindTooltip("Your Location (Origin)", { direction: "top" })
      .addTo($mapInstance);

    // Draw destination marker
    const dest = result.building.marker;
    nearestDestMarker = L.circleMarker(dest, {
      radius: 10,
      color: "#f59e0b",
      fillColor: "#f59e0b",
      fillOpacity: 0.85,
      weight: 3,
    })
      .bindTooltip(`<b>${result.building.name}</b><br>${result.distance.toFixed(0)}m · ~${walkingTimeMin} min walk`, {
        direction: "top",
        permanent: false,
      })
      .addTo($mapInstance);

    // Draw dashed geodesic line connecting origin → nearest facility
    nearestLine = L.polyline([[lat, lng], dest], {
      color: "#f59e0b",
      weight: 2.5,
      dashArray: "10 6",
      opacity: 0.9,
    }).addTo($mapInstance);

    // Fly the map to fit both points
    $mapInstance.fitBounds([[lat, lng], dest], { padding: [60, 60], maxZoom: 19 });
  }

  function clearNearest() {
    if (!$mapInstance) return;
    if (nearestLine) {
      nearestLine.removeFrom($mapInstance);
      nearestLine = undefined;
    }
    if (nearestOriginMarker) {
      nearestOriginMarker.removeFrom($mapInstance);
      nearestOriginMarker = undefined;
    }
    if (nearestDestMarker) {
      nearestDestMarker.removeFrom($mapInstance);
      nearestDestMarker = undefined;
    }
  }

  // ─── GIS Tool: Measurement ───────────────────────────────────────────────────
  // Map clicks only append to the store; visuals are reconciled reactively so that
  // Undo/Clear (driven from the panel) also update the map.
  function addMeasurementPoint(lat: number, lng: number) {
    if (!$mapInstance) return;
    gisStoreV2.addPoint([lat, lng]);
  }

  // Rebuild all measurement overlays from the current store state.
  function reconcileMeasurements() {
    const map = $mapInstance; // lock the value into const variable, $mapInstance is a mutable variable and can change between reactive updates
    if (map == null) return;
    // Clear existing overlays
    if (measureLine) {
      measureLine.removeFrom(map);
      measureLine = undefined;
    }
    if (measurePolygon) {
      measurePolygon.removeFrom(map);
      measurePolygon = undefined;
    }
    measureNodes.forEach((n) => n.removeFrom(map));
    measureNodes = [];

    const points = $gisStoreV2.draftPoints;
    if (points.length === 0) {
      setResultIfChanged({});
      return;
    }

    // Draw a node for every stored point
    measureNodes = points.map((pt) =>
      L.circleMarker(pt, {
        radius: 5,
        color: "#10b981",
        fillColor: "#6ee7b7",
        fillOpacity: 1,
        weight: 2,
      }).addTo(map),
    );

    if ($gisStoreV2.activeTool === "measure_dist" && points.length >= 2) {
      measureLine = L.polyline(points, {
        color: "#10b981",
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);

      let totalDist = 0;
      for (let i = 0; i < points.length - 1; i++) {
        totalDist += getHaversineDistance(points[i], points[i + 1]);
      }
      setResultIfChanged({ distance: totalDist });
    } else if ($gisStoreV2.activeTool === "measure_area" && points.length >= 3) {
      measurePolygon = L.polygon(points, {
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);

      const area = calculatePolygonArea(points);
      const perimeter = calculatePolygonPerimeter(points);
      setResultIfChanged({ area, distance: perimeter });
    } else {
      setResultIfChanged({});
    }
  }

  // Only write to the store when the computed result actually differs, to avoid
  // triggering the reactive reconciliation block in an infinite loop.
  function setResultIfChanged(next: { distance?: number; area?: number }) {
    const cur = $gisStoreV2.measurementResult;
    const same = (cur?.distance ?? undefined) === (next.distance ?? undefined) && (cur?.area ?? undefined) === (next.area ?? undefined);
    if (!same) gisStoreV2.setMeasurementResult(next);
  }

  function clearMeasurements() {
    const map = $mapInstance; // lock the value into const variable, $mapInstance is a mutable variable and can change between reactive updates
    if (map == null) return;
    if (measureLine) {
      measureLine.removeFrom(map);
      measureLine = undefined;
    }
    if (measurePolygon) {
      measurePolygon.removeFrom(map);
      measurePolygon = undefined;
    }
    measureNodes.forEach((n) => n.removeFrom(map));
    measureNodes = [];
  }

  // ── Add Building reconciliation ─────────────────────────────────────────────
  function clearBuildingOverlays() {
    const map = $mapInstance; // lock the value into const variable, $mapInstance is a mutable variable and can change between reactive updates
    if (map == null) return;

    if (buildingPolygon) {
      buildingPolygon.removeFrom(map);
      buildingPolygon = undefined;
    }
    if (buildingCentroid) {
      buildingCentroid.removeFrom(map);
      buildingCentroid = undefined;
    }
    buildingNodes.forEach((n) => n.removeFrom(map));
    buildingNodes = [];
  }

  function reconcileBuilding() {
    const map = $mapInstance; // lock the value into const variable, $mapInstance is a mutable variable and can change between reactive updates
    if (map == null) return;

    clearBuildingOverlays();

    const pts = $gisStoreV2.draftPoints;
    if (pts.length === 0) return;

    buildingNodes = pts.map((pt, idx) =>
      L.circleMarker(pt, {
        radius: 5,
        color: "#2563eb",
        fillColor: "#bfdbfe",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip(`Vertex ${idx + 1}`, { direction: "top" })
        .addTo(map),
    );

    if (pts.length >= 2) {
      buildingPolygon = L.polygon(pts, {
        color: "#2563eb",
        fillColor: "#2563eb",
        fillOpacity: 0.15,
        weight: 3,
      }).addTo(map);
    }

    if (pts.length > 0) {
      const lat = pts.reduce((a, p) => a + p[0], 0) / pts.length;
      const lng = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      buildingCentroid = L.circleMarker([lat, lng], {
        radius: 5,
        color: "#2563eb",
        fillColor: "#eff6ff",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip("Calculated Centroid", { direction: "top" })
        .addTo(map);
    }
  }

  // ─── Reactive subscriptions: respond to store changes ─────────────────────────
  // Track previous values so mouse moves don't retrigger expensive operations
  let _prevCentroids: boolean | undefined;
  let _prevBoundary: boolean | undefined;
  let _prevGrid: boolean | undefined;
  let _prevTool: string | undefined;

  $: {
    const { showCentroids, showBoundaries, showGrid } = $mapSettings;
    const gisTool = $gisStoreV2.activeTool;

    if ($mapInstance) {
      // Centroids overlay
      if (showCentroids !== _prevCentroids) {
        _prevCentroids = showCentroids;
        if (showCentroids) drawCentroids();
        else removeCentroids();
      }

      // UTM Grid overlay
      if (showGrid !== _prevGrid) {
        _prevGrid = showGrid;
        if (showGrid) drawGrid();
        else removeGrid();
      }

      // Tool switching — clear layers only when tool actually changes
      if (gisTool !== _prevTool) {
        if (_prevTool === "buffer") clearBuffer();
        if (_prevTool === "nearest") clearNearest();
        if (_prevTool === "measure_dist" || _prevTool === "measure_area") {
          clearMeasurements();
          gisStoreV2.clearDraft();
        }
        if (_prevTool === "draw_building") {
          clearBuildingOverlays();
          gisStoreV2.clearDraft();
        }

        // Cursor style
        const container = $mapInstance.getContainer();
        container.style.cursor = gisTool !== "none" ? "crosshair" : "";

        _prevTool = gisTool;
      }
    }
  }

  // Reconcile measurement overlays whenever the stored points or active tool change
  // (covers map clicks, Undo, Clear, and mode switches from the panel).
  $: if ($mapInstance && ($gisStoreV2.activeTool === "measure_dist" || $gisStoreV2.activeTool === "measure_area")) {
    reconcileMeasurements();
  }

  // Reconcile building-drawing overlays whenever points or active tool change.
  $: if ($mapInstance && $gisStoreV2.activeTool === "draw_building") {
    reconcileBuilding();
  }
</script>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<div class="map w-screen h-screen {classes}" use:createMap />
