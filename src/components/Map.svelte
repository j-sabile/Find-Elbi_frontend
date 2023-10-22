<script lang="ts">
  export let classes = "";
  import { elbiMap } from "../stores/map";
  import L from "leaflet";
  let prevZoom = 18;

  function createMap(container: any) {
    elbiMap.set(
      L.map(container, {
        zoomControl: false,
        preferCanvas: true,
        maxZoom: 22,
        minZoom: 15,
      })
        .setView([14.163, 121.24], 18)
        .on("zoom", (e) => handleZoomChange(e.target._zoom))
    );

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo($elbiMap);
  }

  const lvlChange = 18;
  function handleZoomChange(level: number) {
    if (level <= lvlChange && prevZoom > lvlChange) {
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo($elbiMap);
      prevZoom = level;
    } else if (level > lvlChange && prevZoom <= lvlChange) {
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 22,
      }).addTo($elbiMap);
      prevZoom = level;
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
