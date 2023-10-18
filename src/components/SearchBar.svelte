<script lang="ts">
  let searchInput = "";
  function handleSearch() {}
</script>

<div class="searchbar bg-white rounded-full self-center w-11/12">
  <!-- {#if navStack.length > 0}
    <button class="px-4 text-xs font-semibold py-1 rounded-full outline-none" on:click={handleBack}>Back</button>
  {/if} -->
  <form on:submit={handleSearch} class="flex flex-row w-full">
    <input class="search px-4 py-1 rounded-full" placeholder="Find a place" bind:value={searchInput} />
    <button class="px-4 text-xs font-semibold py-1 rounded-full" type="submit" on:click={handleSearch}>Search</button>
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
