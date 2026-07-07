<script lang="ts">
  import BottomPanel from "./components/BottomPanel.svelte";
  import Map from "./components/Map.svelte";
  import SearchBar from "./components/SearchBar.svelte";
  import GisSidebar from "./components/GisSidebar.svelte";
  import GisCoordWidget from "./components/GisCoordWidget.svelte";
</script>

<div class="flex flex-col h-screen w-screen min-h-screen max-h-screen relative overflow-hidden bg-slate-900">
  <Map classes="flex flex-grow z-0" />
  <SearchBar />
  <BottomPanel />
  <GisSidebar />
  <GisCoordWidget />
</div>


<style>
</style>
