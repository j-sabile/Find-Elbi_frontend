<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { mapInstance } from "../../stores/mapV2";
  import { gisStoreV2 } from "../../stores/gisV2";
  import L from "leaflet";
  import { getHaversineDistance, calculatePolygonArea, calculatePolygonPerimeter } from "../../utils/gisConvert";

  let measureLine: L.Polyline | undefined;
  let measurePolygon: L.Polygon | undefined;
  let measureNodes: L.CircleMarker[] = [];

  function handleMapClick(e: L.LeafletMouseEvent) {
    // Just push to store. The reactive block below will handle the drawing.
    gisStoreV2.addPoint([e.latlng.lat, e.latlng.lng]);
  }

  function clearLayers(map: L.Map) {
    if (measureLine) measureLine.removeFrom(map);
    if (measurePolygon) measurePolygon.removeFrom(map);
    measureNodes.forEach((n) => n.removeFrom(map));
    measureNodes = [];
  }

  // React to draft points or tool changes
  $: {
    const map = $mapInstance;
    const points = $gisStoreV2.draftPoints;
    const tool = $gisStoreV2.activeTool;

    if (map) {
      clearLayers(map);

      if (points.length > 0) {
        measureNodes = points.map((pt) =>
          L.circleMarker(pt, {
            radius: 5,
            color: "#10b981",
            fillColor: "#6ee7b7",
            fillOpacity: 1,
            weight: 2,
          }).addTo(map),
        );

        if (tool === "measure_dist" && points.length >= 2) {
          measureLine = L.polyline(points, { color: "#10b981", weight: 2, dashArray: "6 4" }).addTo(map);

          let totalDist = 0;
          for (let i = 0; i < points.length - 1; i++) totalDist += getHaversineDistance(points[i], points[i + 1]);
          setResultIfChanged({ distance: totalDist });
        } else if (tool === "measure_area" && points.length >= 3) {
          measurePolygon = L.polygon(points, { color: "#10b981", fillColor: "#10b981", fillOpacity: 0.1, weight: 2, dashArray: "6 4" }).addTo(map);

          const area = calculatePolygonArea(points);
          const perimeter = calculatePolygonPerimeter(points);
          setResultIfChanged({ area, distance: perimeter });
        } else {
          setResultIfChanged({});
        }
      } else {
        setResultIfChanged({});
      }
    }
  }

  function setResultIfChanged(next: { distance?: number; area?: number }) {
    const cur = $gisStoreV2.measurementResult;
    const same = cur?.distance === next.distance && cur?.area === next.area;
    if (!same) gisStoreV2.setMeasurementResult(next);
  }

  onMount(() => {
    if ($mapInstance) $mapInstance.on("click", handleMapClick);
  });

  onDestroy(() => {
    if ($mapInstance) {
      $mapInstance.off("click", handleMapClick);
      clearLayers($mapInstance);
    }
    // Clean up store data when switching tools
    gisStoreV2.clearDraft();
  });
</script>
