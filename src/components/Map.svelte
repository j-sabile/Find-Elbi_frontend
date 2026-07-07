<script lang="ts">
  export let classes = "";
  import { elbiMap } from "../stores/map";
  import { gisStore } from "../stores/gis";
  import type { BasemapType } from "../stores/gis";
  import { mapStatus } from "../stores/mapStatus";
  import L, { type TileLayer, type CircleMarker, type Polyline, type Polygon, type Circle } from "leaflet";
  import buildings from "../data/buildings";
  import {
    findNearestBuilding,
    getHaversineDistance,
    calculatePolygonArea,
    calculatePolygonPerimeter,
  } from "../utils/gisConvert";
  import { handleSelectBuilding } from "../utils/mapUtil";

  // ─── Tile layer references ──────────────────────────────────────────────────
  const TILE_URLS: Record<BasemapType, { url: string; options: any }> = {
    osm: {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 22,
      },
    },
    carto: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      options: { subdomains: "abcd", maxZoom: 22 },
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      options: {
        attribution: "Tiles &copy; Esri",
        maxZoom: 22,
      },
    },
    topo: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      options: {
        attribution: "Map data: &copy; OpenStreetMap, SRTM | Rendering: &copy; OpenTopoMap",
        maxZoom: 17,
      },
    },
  };

  // ─── Overlay layer collections ───────────────────────────────────────────────
  let tileLayer: TileLayer | undefined;
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

  // ─── Campus boundary polygon (rough bounding area of UPLB) ──────────────────
  const CAMPUS_BOUNDARY: [number, number][] = [
    [14.1649, 121.2371],
    [14.1679, 121.2390],
    [14.1679, 121.2435],
    [14.1658, 121.2468],
    [14.1635, 121.2480],
    [14.1601, 121.2478],
    [14.1572, 121.2462],
    [14.1558, 121.2430],
    [14.1565, 121.2395],
    [14.1589, 121.2371],
    [14.1620, 121.2360],
    [14.1649, 121.2371],
  ];

  // ─── Map initialization ──────────────────────────────────────────────────────
  function createMap(container: HTMLElement) {
    elbiMap.set(
      L.map(container, {
        zoomControl: false,
        preferCanvas: true,
        maxZoom: 22,
        minZoom: 13,
      })
        .setView([14.163, 121.24], 17)
    );

    // Add custom zoom control in top-left
    L.control.zoom({ position: "topleft" }).addTo($elbiMap);

    // Load initial tile layer
    applyBasemap($gisStore.activeBasemap);

    // Mouse move → track coordinates
    $elbiMap.on("mousemove", (e: L.LeafletMouseEvent) => {
      gisStore.setMouseLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    $elbiMap.on("mouseout", () => {
      gisStore.setMouseLatLng(null);
    });

    // Map click → delegate to active GIS tool
    $elbiMap.on("click", (e: L.LeafletMouseEvent) => {
      handleMapClick(e.latlng.lat, e.latlng.lng);
    });

    // Redraw grid on zoom/move
    $elbiMap.on("moveend", () => {
      if ($gisStore.overlayGrid) drawGrid();
    });
  }

  // ─── Basemap management ──────────────────────────────────────────────────────
  function applyBasemap(basemap: BasemapType) {
    if (!$elbiMap) return;
    if (tileLayer) {
      $elbiMap.removeLayer(tileLayer);
      tileLayer = undefined;
    }
    const { url, options } = TILE_URLS[basemap];
    tileLayer = L.tileLayer(url, options).addTo($elbiMap);
  }

  // ─── Overlay: Building Centroids ─────────────────────────────────────────────
  function drawCentroids() {
    if (!$elbiMap) return;
    centroidMarkers.forEach((m) => m.removeFrom($elbiMap));
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
        .addTo($elbiMap);
      centroidMarkers.push(m);
    });
  }

  function removeCentroids() {
    if (!$elbiMap) return;
    centroidMarkers.forEach((m) => m.removeFrom($elbiMap));
    centroidMarkers = [];
  }

  // ─── Overlay: Campus Boundary ────────────────────────────────────────────────
  function drawBoundary() {
    if (!$elbiMap) return;
    removeBoundary();
    boundaryPolyline = L.polyline(CAMPUS_BOUNDARY, {
      color: "#ef4444",
      weight: 2,
      dashArray: "8 6",
      opacity: 0.8,
    })
      .bindTooltip("UPLB Campus Study Boundary", { sticky: true, opacity: 0.8 })
      .addTo($elbiMap);
  }

  function removeBoundary() {
    if (!$elbiMap || !boundaryPolyline) return;
    boundaryPolyline.removeFrom($elbiMap);
    boundaryPolyline = undefined;
  }

  // ─── Overlay: UTM Grid Lines ─────────────────────────────────────────────────
  function drawGrid() {
    if (!$elbiMap) return;
    removeGrid();
    const bounds = $elbiMap.getBounds();
    const STEP = 0.001; // ~111m spacing

    const minLat = Math.floor(bounds.getSouth() / STEP) * STEP;
    const maxLat = Math.ceil(bounds.getNorth() / STEP) * STEP;
    const minLng = Math.floor(bounds.getWest() / STEP) * STEP;
    const maxLng = Math.ceil(bounds.getEast() / STEP) * STEP;

    const gridStyle = { color: "#3b82f6", weight: 0.5, opacity: 0.35, dashArray: "2 4" };

    // Horizontal lines (constant lat)
    for (let lat = minLat; lat <= maxLat; lat = Math.round((lat + STEP) * 10000) / 10000) {
      gridLines.push(
        L.polyline([[lat, minLng], [lat, maxLng]], gridStyle).addTo($elbiMap)
      );
    }
    // Vertical lines (constant lng)
    for (let lng = minLng; lng <= maxLng; lng = Math.round((lng + STEP) * 10000) / 10000) {
      gridLines.push(
        L.polyline([[minLat, lng], [maxLat, lng]], gridStyle).addTo($elbiMap)
      );
    }
  }

  function removeGrid() {
    if (!$elbiMap) return;
    gridLines.forEach((l) => l.removeFrom($elbiMap));
    gridLines = [];
  }

  // ─── GIS Tool: Buffer Query ──────────────────────────────────────────────────
  function runBufferQuery(lat: number, lng: number) {
    if (!$elbiMap) return;
    clearBuffer();

    const radius = $gisStore.bufferRadius;
    bufferCircle = L.circle([lat, lng], {
      radius,
      color: "#38bdf8",
      fillColor: "#38bdf8",
      fillOpacity: 0.08,
      weight: 2,
      dashArray: "6 4",
    }).addTo($elbiMap);

    gisStore.setBufferCenter([lat, lng]);

    // Find all buildings within the buffer radius
    const results = buildings
      .map((b) => ({ building: b, distance: getHaversineDistance([lat, lng], b.marker) }))
      .filter((r) => r.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    gisStore.setBufferResults(results);

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
        .addTo($elbiMap)
    );
  }

  function clearBuffer() {
    if (!$elbiMap) return;
    if (bufferCircle) { bufferCircle.removeFrom($elbiMap); bufferCircle = undefined; }
    bufferMarkers.forEach((m) => m.removeFrom($elbiMap));
    bufferMarkers = [];
  }

  // ─── GIS Tool: Nearest Facility ──────────────────────────────────────────────
  function runNearestFacility(lat: number, lng: number) {
    if (!$elbiMap) return;
    clearNearest();

    const result = findNearestBuilding([lat, lng], $gisStore.nearestTargetType, buildings);
    if (!result) return;

    // Walking time: assume average 1.2 m/s walking speed
    const walkingTimeMin = Math.ceil(result.distance / 1.2 / 60);

    gisStore.setNearestOrigin([lat, lng]);
    gisStore.setNearestResult({ ...result, walkingTimeMin });

    // Draw origin marker (pulsing look via CSS class)
    nearestOriginMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: "#f59e0b",
      fillColor: "#fef3c7",
      fillOpacity: 1,
      weight: 2.5,
    })
      .bindTooltip("Your Location (Origin)", { direction: "top" })
      .addTo($elbiMap);

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
      .addTo($elbiMap);

    // Draw dashed geodesic line connecting origin → nearest facility
    nearestLine = L.polyline([[lat, lng], dest], {
      color: "#f59e0b",
      weight: 2.5,
      dashArray: "10 6",
      opacity: 0.9,
    }).addTo($elbiMap);

    // Fly the map to fit both points
    $elbiMap.fitBounds([[lat, lng], dest], { padding: [60, 60], maxZoom: 19 });
  }

  function clearNearest() {
    if (!$elbiMap) return;
    if (nearestLine) { nearestLine.removeFrom($elbiMap); nearestLine = undefined; }
    if (nearestOriginMarker) { nearestOriginMarker.removeFrom($elbiMap); nearestOriginMarker = undefined; }
    if (nearestDestMarker) { nearestDestMarker.removeFrom($elbiMap); nearestDestMarker = undefined; }
  }

  // ─── GIS Tool: Measurement ───────────────────────────────────────────────────
  function addMeasurementPoint(lat: number, lng: number) {
    if (!$elbiMap) return;
    gisStore.addMeasurementPoint([lat, lng]);

    const points = $gisStore.measurementPoints;

    // Draw node
    const node = L.circleMarker([lat, lng], {
      radius: 5,
      color: "#10b981",
      fillColor: "#6ee7b7",
      fillOpacity: 1,
      weight: 2,
    }).addTo($elbiMap);
    measureNodes.push(node);

    if ($gisStore.gisTool === "measure_dist" && points.length >= 2) {
      // Update polyline
      if (measureLine) measureLine.removeFrom($elbiMap);
      measureLine = L.polyline(points, {
        color: "#10b981",
        weight: 2,
        dashArray: "6 4",
      }).addTo($elbiMap);

      // Compute total geodesic path length
      let totalDist = 0;
      for (let i = 0; i < points.length - 1; i++) {
        totalDist += getHaversineDistance(points[i], points[i + 1]);
      }
      gisStore.setMeasurementResult({ distance: totalDist });
    } else if ($gisStore.gisTool === "measure_area" && points.length >= 3) {
      // Update filled polygon
      if (measurePolygon) measurePolygon.removeFrom($elbiMap);
      if (measureLine) { measureLine.removeFrom($elbiMap); measureLine = undefined; }
      measurePolygon = L.polygon(points, {
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "6 4",
      }).addTo($elbiMap);

      const area = calculatePolygonArea(points);
      const perimeter = calculatePolygonPerimeter(points);
      gisStore.setMeasurementResult({ area, distance: perimeter });
    }
  }

  function clearMeasurements() {
    if (!$elbiMap) return;
    if (measureLine) { measureLine.removeFrom($elbiMap); measureLine = undefined; }
    if (measurePolygon) { measurePolygon.removeFrom($elbiMap); measurePolygon = undefined; }
    measureNodes.forEach((n) => n.removeFrom($elbiMap));
    measureNodes = [];
  }

  // ─── Unified Map Click Handler ────────────────────────────────────────────────
  function handleMapClick(lat: number, lng: number) {
    const tool = $gisStore.gisTool;
    if (tool === "buffer") runBufferQuery(lat, lng);
    else if (tool === "nearest") runNearestFacility(lat, lng);
    else if (tool === "measure_dist" || tool === "measure_area") addMeasurementPoint(lat, lng);
  }

  // ─── Reactive subscriptions: respond to store changes ─────────────────────────
  // Track previous values so mouse moves don't retrigger expensive operations
  let _prevBasemap: string | undefined;
  let _prevCentroids: boolean | undefined;
  let _prevBoundary: boolean | undefined;
  let _prevGrid: boolean | undefined;
  let _prevTool: string | undefined;

  $: {
    const { activeBasemap, overlayCentroids, overlayBoundary, overlayGrid, gisTool } = $gisStore;

    if ($elbiMap) {
      // Basemap — only swap tile layer when basemap selection actually changes
      if (activeBasemap !== _prevBasemap) {
        _prevBasemap = activeBasemap;
        applyBasemap(activeBasemap);
      }

      // Centroids overlay
      if (overlayCentroids !== _prevCentroids) {
        _prevCentroids = overlayCentroids;
        if (overlayCentroids) drawCentroids();
        else removeCentroids();
      }

      // Campus boundary overlay
      if (overlayBoundary !== _prevBoundary) {
        _prevBoundary = overlayBoundary;
        if (overlayBoundary) drawBoundary();
        else removeBoundary();
      }

      // UTM Grid overlay
      if (overlayGrid !== _prevGrid) {
        _prevGrid = overlayGrid;
        if (overlayGrid) drawGrid();
        else removeGrid();
      }

      // Tool switching — clear layers only when tool actually changes
      if (gisTool !== _prevTool) {
        if (_prevTool === "buffer") clearBuffer();
        if (_prevTool === "nearest") clearNearest();
        if (_prevTool === "measure_dist" || _prevTool === "measure_area") {
          clearMeasurements();
          gisStore.clearMeasurements();
        }

        // Cursor style
        const container = $elbiMap.getContainer();
        container.style.cursor = gisTool !== "none" ? "crosshair" : "";

        _prevTool = gisTool;
      }
    }
  }
</script>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<div class="map {classes}" use:createMap />

<style>
  .map {
    width: 100vw;
    height: 100vh;
  }
</style>
