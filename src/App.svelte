<script lang="ts">
  import Map from "./components/Map.svelte";
  import SearchBarV2 from "./components/SearchBarV2.svelte";
  import BuildingInfoCardV2 from "./components/BuildingInfoCardV2.svelte";
  import AddBuildingToolV2 from "./components/AddBuildingToolV2.svelte";
  import MapToolbarV2 from "./components/MapToolbarV2.svelte";
  import { navigationStoreV2 } from "./stores/navigationV2";
</script>

<div class="flex flex-col h-screen w-screen min-h-screen max-h-screen relative overflow-hidden bg-slate-900">
  <Map classes="flex flex-grow z-0" />
  <SearchBarV2 />
  {#if $navigationStoreV2.selectedBuilding}
    <BuildingInfoCardV2 building={$navigationStoreV2.selectedBuilding} />
  {/if}
  <MapToolbarV2 />
  <!-- <AddBuildingToolV2 /> -->
</div>

<style>
</style>
