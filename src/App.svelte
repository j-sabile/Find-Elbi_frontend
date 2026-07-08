<script lang="ts">
  import BottomPanel from "./components/BottomPanel.svelte";
  import Map from "./components/Map.svelte";
  import SearchBar from "./components/SearchBar.svelte";
  import SearchBarV2 from "./components/SearchBarV2.svelte";
  import BuildingInfoCardV2 from "./components/BuildingInfoCardV2.svelte";
  import GisSidebar from "./components/GisSidebar.svelte";
  import GisCoordWidget from "./components/GisCoordWidget.svelte";
  import AddBuildingTool from "./components/AddBuildingTool.svelte";
  import MapToolbarV2 from "./components/MapToolbarV2.svelte";
  import { mapStatus } from "./stores/mapStatus";
</script>

<div class="flex flex-col h-screen w-screen min-h-screen max-h-screen relative overflow-hidden bg-slate-900">
  <Map classes="flex flex-grow z-0" />
  <SearchBarV2 />
  {#if $mapStatus.selectedBuilding}
    <BuildingInfoCardV2 building={$mapStatus.selectedBuilding} />
  {/if}
  <MapToolbarV2 />
  <!-- <SearchBar /> -->
  <!-- <BottomPanel /> -->
  <!-- <GisSidebar /> -->
  <!-- <GisCoordWidget /> -->
  <!-- <AddBuildingTool /> -->
</div>

<style>
</style>
