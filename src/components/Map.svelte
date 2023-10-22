<script lang="ts">
  export let classes = "";
  import { elbiMap } from "../stores/map";
  import L, { TileLayer } from "leaflet";
  let prevZoom = 18;
  let tileOut: TileLayer | undefined, tileIn: TileLayer | undefined;

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

    tileOut = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo($elbiMap);
  }

  const lvlChange = 19;
  function handleZoomChange(level: number) {
    console.log(level);
    console.log(tileIn, tileOut);
    if (level <= lvlChange && tileIn !== undefined) {
      console.log("CASE1");
      tileOut = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo($elbiMap);
      $elbiMap.removeLayer(tileIn);
      tileIn = undefined;
      prevZoom = level;
    } else if (level > lvlChange && tileOut !== undefined) {
      console.log("CASE2");
      tileIn = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 22,
      }).addTo($elbiMap);
      $elbiMap.removeLayer(tileOut);
      tileOut = undefined;
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
