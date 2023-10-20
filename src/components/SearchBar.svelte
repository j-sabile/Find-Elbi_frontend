<script lang="ts">
  import { STACKSTATUS } from "../data/constants";
  import { mapStack } from "../stores/mapStack";
  import { mapStatus } from "../stores/mapStatus";

  let searchInput = "";
  function handleSearch(e: any) {
    e.preventDefault();
    mapStack.pushMapStatus($mapStatus);
    mapStatus.reset();
    mapStatus.setStatus(STACKSTATUS.SEARCH);
  }
  function handleBack() {
    let temp = mapStack.popMapStatus();
    mapStatus.set(temp);
    searchInput = $mapStatus.searchInput;
  }

  function handleLogStack(e: any) {
    e.preventDefault();
    console.log("Map Stack:", $mapStack);
    console.log("Map Status:", $mapStatus);
  }
</script>

<div class="searchbar bg-white rounded-full self-center">
  {#if $mapStatus.status != STACKSTATUS.HOME}
    <button class="px-4 text-xs font-semibold py-1 rounded-full outline-none" on:click={handleBack}>Back</button>
  {/if}
  <form on:submit={handleSearch} class="flex flex-row w-full">
    <input class="search px-4 py-1 rounded-full" placeholder="Find a place" bind:value={searchInput} tabindex="0" />
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
