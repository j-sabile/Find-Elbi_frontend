<script lang="ts">
  import { STACKSTATUS } from "../data/constants";
  import { mapStatus } from "../stores/mapStatus";
  import { elbiMap } from "../stores/map";
  import L from "leaflet";
  import search from "../utils/search";
  import * as mapStackUtil from "../utils/mapStackUtil";
  import { handleSelectBuilding } from "../utils/mapUtil";

  function handleSearch(e: any) {
    e.preventDefault();
    let tempSearchInput = $mapStatus.searchInput;
    mapStatus.setSearchInput("");
    mapStackUtil.push($mapStatus, true);
    mapStatus.setStatus(STACKSTATUS.SEARCH);
    mapStatus.setSearchInput(tempSearchInput);
    const searchResults = search(tempSearchInput);
    mapStatus.setSearchResults(searchResults);
    const markers = searchResults.map((building) =>
      new L.Marker(building.marker)
        .bindTooltip(building.name)
        .on("click", () => handleSelectBuilding(building))
        .addTo($elbiMap)
    );
    mapStatus.setMarkers(markers);
    $elbiMap.fitBounds(
      searchResults.map((i) => i.marker),
      { padding: [50, 50] }
    );
  }

  function handleBack() {
    mapStackUtil.pop();
  }

  function handleLogStack(e: any) {
    e.preventDefault();
    mapStackUtil.log();
  }
</script>

<div class="searchbar bg-white rounded-full self-center">
  {#if $mapStatus.status !== STACKSTATUS.HOME}
    <button class="px-4 text-xs font-semibold py-1 rounded-full outline-none" on:click={handleBack}>Back</button>
  {/if}
  <form on:submit={handleSearch} class="flex flex-row w-full">
    <input class="search px-4 py-1 rounded-full" placeholder="Find a place" bind:value={$mapStatus.searchInput} tabindex="0" />
    <button class="px-4 text-xs font-semibold py-1 rounded-full" type="submit" on:click={handleSearch}>Search</button>
    <button class="text-xs pe-2 font-semibold" on:click={handleLogStack}>Log</button>
  </form>
</div>

<style>
  .searchbar {
    position: absolute;
    border: 1px solid grey;
    z-index: 1;
    margin: 1rem;
    display: flex;
    gap: 2px;
    justify-content: center;
    box-sizing: border-box;
    width: 80%;
    max-width: 35rem;
  }

  .search {
    width: 100%;
  }

  .search:focus,
  .search:active {
    border: 0;
    outline: none;
  }
</style>
