<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { mapInstance } from "../../stores/mapV2";
  import { gisStoreV2 } from "../../stores/gisV2";
  import L from "leaflet";
  import buildings from "../../data/buildings";
  import { getHaversineDistance } from "../../utils/gisConvert";

  let bufferCircle: L.Circle | undefined;
  let bufferMarkers: L.CircleMarker[] = [];

  function handleMapClick(e: L.LeafletMouseEvent) {
    const map = $mapInstance;
    if (!map) return;

    clearLayers(map); // Clear previous buffer if clicking again

    const { lat, lng } = e.latlng;
    const radius = $gisStoreV2.bufferRadius;

    // Draw Buffer Circle
    bufferCircle = L.circle([lat, lng], {
      radius,
      color: "#38bdf8",
      fillColor: "#38bdf8",
      fillOpacity: 0.08,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    // Update Store
    gisStoreV2.executeBufferQuery([lat, lng]);

    // Draw matching building markers
    const results = buildings
      .map((b) => ({ building: b, distance: getHaversineDistance([lat, lng], b.marker) }))
      .filter((r) => r.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

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

  function clearLayers(map: L.Map) {
    if (bufferCircle) bufferCircle.removeFrom(map);
    bufferMarkers.forEach((m) => m.removeFrom(map));
    bufferMarkers = [];
  }

  onMount(() => {
    // Attach our specific tool click listener to the map
    if ($mapInstance) $mapInstance.on("click", handleMapClick);
  });

  onDestroy(() => {
    // When tool changes, clean up our event listener and all drawn layers!
    if ($mapInstance) {
      $mapInstance.off("click", handleMapClick);
      clearLayers($mapInstance);
    }
  });
</script>
