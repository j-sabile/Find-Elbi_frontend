<!-- <script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { mapInstance } from "../../stores/mapV2";
  import { gisStoreV2 } from "../../stores/gisV2";
  import L from "leaflet";

  let buildingPolygon: L.Polygon | undefined;
  let buildingCentroid: L.CircleMarker | undefined;
  let buildingNodes: L.CircleMarker[] = [];

  function handleMapClick(e: L.LeafletMouseEvent) {
    // Let the store hold the truth. The reactive block will paint it.
    gisStoreV2.addPoint([e.latlng.lat, e.latlng.lng]);
  }

  function clearLayers(map: L.Map) {
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

  // Reactively reconcile map layers whenever draft points change
  // $: {
  //   const map = $mapInstance;
  //   const pts = $gisStoreV2.draftPoints;

  //   if (map) {
  //     clearLayers(map);

  //     if (pts.length > 0) {
  //       // Draw Vertices
  //       buildingNodes = pts.map((pt, idx) =>
  //         L.circleMarker(pt, {
  //           radius: 5,
  //           color: "#2563eb",
  //           fillColor: "#bfdbfe",
  //           fillOpacity: 1,
  //           weight: 2,
  //         })
  //           .bindTooltip(`Vertex ${idx + 1}`, { direction: "top" })
  //           .addTo(map),
  //       );

  //       // Draw Polygon Area (Requires at least 2 points for a line, 3 for area)
  //       if (pts.length >= 2) {
  //         buildingPolygon = L.polygon(pts, {
  //           color: "#2563eb",
  //           fillColor: "#2563eb",
  //           fillOpacity: 0.15,
  //           weight: 3,
  //         }).addTo(map);
  //       }

  //       // Calculate and Draw Temporary Centroid
  //       const lat = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  //       const lng = pts.reduce((a, p) => a + p[1], 0) / pts.length;

  //       buildingCentroid = L.circleMarker([lat, lng], {
  //         radius: 5,
  //         color: "#2563eb",
  //         fillColor: "#eff6ff",
  //         fillOpacity: 1,
  //         weight: 2,
  //       })
  //         .bindTooltip("Calculated Centroid", { direction: "top" })
  //         .addTo(map);
  //     }
  //   }
  // }

  onMount(() => {
    if ($mapInstance) $mapInstance.on("click", handleMapClick);
  });

  onDestroy(() => {
    if ($mapInstance) {
      $mapInstance.off("click", handleMapClick);
      clearLayers($mapInstance);
    }
    // Wipe the draft state when changing tools
    gisStoreV2.clearDraft();
  });
</script> -->
