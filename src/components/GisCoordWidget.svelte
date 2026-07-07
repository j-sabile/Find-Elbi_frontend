<script lang="ts">
  import { gisStore } from "../stores/gis";
  import { latLngToUTM, latLngToWebMercator } from "../utils/gisConvert";

  export const _unused = undefined;
  $: mousePos = $gisStore.mouseLatLng;
  $: utm = mousePos ? latLngToUTM(mousePos.lat, mousePos.lng) : null;
  $: mercator = mousePos ? latLngToWebMercator(mousePos.lat, mousePos.lng) : null;
</script>

<div class="absolute top-6 left-4 z-[1000] p-3 rounded-lg shadow-lg border border-slate-700 bg-slate-900/85 bg-black text-white text-[11px] font-mono pointer-events-none flex flex-col gap-1 w-64 md:w-72">
  <div class="flex items-center gap-1.5 border-b border-slate-700 pb-1.5 mb-1.5">
    <div class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
    <span class="font-bold tracking-wider text-slate-400">CRS TRACKER (ZONE 51N)</span>
  </div>
  {#if mousePos}
    <div class="flex justify-between">
      <span class="text-slate-400">WGS84 (Lat/Lng):</span>
      <span class="text-emerald-400 font-semibold">{mousePos.lat.toFixed(6)}, {mousePos.lng.toFixed(6)}</span>
    </div>
    <div class="flex justify-between">
      <span class="text-slate-400">Web Mercator (3857):</span>
      <span class="text-sky-400 font-semibold">{mercator?.x.toFixed(0)}m E, {mercator?.y.toFixed(0)}m N</span>
    </div>
    <div class="flex justify-between">
      <span class="text-slate-400">UTM Zone 51N (32651):</span>
      <span class="text-amber-400 font-semibold">{utm?.easting.toFixed(1)}m E, {utm?.northing.toFixed(1)}m N</span>
    </div>
  {:else}
    <div class="text-slate-400 text-center py-2 animate-pulse">
      Move cursor over the map to track coordinates
    </div>
  {/if}
</div>
