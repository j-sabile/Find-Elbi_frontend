<script lang="ts">
  import Map from "./components/Map.svelte";
  import SearchBarV2 from "./components/SearchBarV2.svelte";
  import BuildingInfoCardV2 from "./components/BuildingInfoCardV2.svelte";
  import MapToolbarV2 from "./components/MapToolbarV2.svelte";
  import AddBuildingPanel from "./components/add-building/AddBuildingPanel.svelte";
</script>

<div class="flex flex-col h-screen w-screen min-h-screen max-h-screen relative overflow-hidden bg-slate-900">
  <Map classes="flex flex-grow z-0" />
  <SearchBarV2 />
  <BuildingInfoCardV2 />
  <MapToolbarV2 />
  <!-- <AddBuildingPanel /> -->
</div>

<style>
</style>
