<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { mapInstance } from "../../stores/mapV2";
  import { gisStoreV2 } from "../../stores/gisV2";
  import L from "leaflet";
  import buildings from "../../data/buildings";

  let nearestLine: L.Polyline | undefined;
  let nearestOriginMarker: L.CircleMarker | undefined;
  let nearestDestMarker: L.CircleMarker | undefined;

  function handleMapClick(e: L.LeafletMouseEvent) {
    const map = $mapInstance;
    if (!map) return;

    clearLayers(map);
    const { lat, lng } = e.latlng;

    // Execute query in the store
    gisStoreV2.executeNearestQuery([lat, lng]);

    // Read the updated result synchronously from the store
    const stored = $gisStoreV2.nearestResult;
    if (!stored) return;

    const building = buildings.find((b) => b.id === stored.buildingId);
    if (!building) return;

    // Draw Origin Marker
    nearestOriginMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: "#f59e0b",
      fillColor: "#fef3c7",
      fillOpacity: 1,
      weight: 2.5,
    })
      .bindTooltip("Your Location (Origin)", { direction: "top" })
      .addTo(map);

    // Draw Destination Marker
    const dest = building.marker;
    nearestDestMarker = L.circleMarker(dest, {
      radius: 10,
      color: "#f59e0b",
      fillColor: "#f59e0b",
      fillOpacity: 0.85,
      weight: 3,
    })
      .bindTooltip(`<b>${building.name}</b><br>${stored.distance.toFixed(0)}m · ~${stored.walkingTimeMin} min walk`, { direction: "top", permanent: false })
      .addTo(map);

    // Draw Dashed Line
    nearestLine = L.polyline([[lat, lng], dest], {
      color: "#f59e0b",
      weight: 2.5,
      dashArray: "10 6",
      opacity: 0.9,
    }).addTo(map);

    // Smoothly fly the map to fit both points
    map.fitBounds([[lat, lng], dest], { padding: [60, 60], maxZoom: 19 });
  }

  function clearLayers(map: L.Map) {
    if (nearestLine) {
      nearestLine.removeFrom(map);
      nearestLine = undefined;
    }
    if (nearestOriginMarker) {
      nearestOriginMarker.removeFrom(map);
      nearestOriginMarker = undefined;
    }
    if (nearestDestMarker) {
      nearestDestMarker.removeFrom(map);
      nearestDestMarker = undefined;
    }
  }

  onMount(() => {
    if ($mapInstance) $mapInstance.on("click", handleMapClick);
  });

  onDestroy(() => {
    if ($mapInstance) {
      $mapInstance.off("click", handleMapClick);
      clearLayers($mapInstance);
    }
  });
</script>
