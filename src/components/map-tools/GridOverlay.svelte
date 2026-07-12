<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { mapInstance } from "../../stores/mapV2";
  import L from "leaflet";

  let gridLines: L.Polyline[] = [];

  onMount(() => {
    const map = $mapInstance;
    if (!map) return;

    const bounds = map.getBounds();
    const STEP = 0.001;

    const minLat = Math.floor(bounds.getSouth() / STEP) * STEP;
    const maxLat = Math.ceil(bounds.getNorth() / STEP) * STEP;
    const minLng = Math.floor(bounds.getWest() / STEP) * STEP;
    const maxLng = Math.ceil(bounds.getEast() / STEP) * STEP;

    const gridStyle = { color: "#3b82f6", weight: 0.5, opacity: 0.35, dashArray: "2 4" };

    // Horizontal
    for (let lat = minLat; lat <= maxLat; lat = Math.round((lat + STEP) * 10000) / 10000) {
      gridLines.push(
        L.polyline(
          [
            [lat, minLng],
            [lat, maxLng],
          ],
          gridStyle,
        ).addTo(map),
      );
    }
    // Vertical
    for (let lng = minLng; lng <= maxLng; lng = Math.round((lng + STEP) * 10000) / 10000) {
      gridLines.push(
        L.polyline(
          [
            [minLat, lng],
            [maxLat, lng],
          ],
          gridStyle,
        ).addTo(map),
      );
    }
  });

  onDestroy(() => {
    // Automatically clears the grid when $mapSettings.showGrid becomes false
    const map = $mapInstance;
    if (map) gridLines.forEach((l) => l.removeFrom(map));
  });
</script>
