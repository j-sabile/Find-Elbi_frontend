<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { mapInstance } from "../../stores/mapV2";
  import L from "leaflet";
  import buildings from "../../data/buildings";

  let centroidMarkers: L.CircleMarker[] = [];

  onMount(() => {
    const map = $mapInstance;
    if (!map) return;

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
  });

  onDestroy(() => {
    const map = $mapInstance;
    if (map) centroidMarkers.forEach((m) => m.removeFrom(map));
  });
</script>
