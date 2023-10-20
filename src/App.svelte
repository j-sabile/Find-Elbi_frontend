<script lang="ts">
  import BottomPanel from "./components/BottomPanel.svelte";
  import Map from "./components/Map.svelte";
  import SearchBar from "./components/SearchBar.svelte";
</script>

<div class="flex flex-col h-screen w-screen min-h-screen max-h-screen relative">
  <Map classes="flex flex-grow z-0" />
  <SearchBar />
  <BottomPanel />
</div>

<style>
</style>
