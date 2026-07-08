<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { mapStatus } from "../stores/mapStatus";
  import type { ISearchResult } from "../interfaces/ISearchResult";
  import { searchV2 } from "../utils/searchV2";
  import { handleSelectBuilding, handleUnselect } from "../utils/mapUtil";
  import SearchResultItemV2 from "./SearchResultItemV2.svelte";

  const SHORTCUT_KEY: string = "/";
  const DEBOUNCE_MS = 250;

  let query = "";
  let results: ISearchResult[] = [];
  let open = false;
  let activeIndex = -1;
  let focused = false;

  let inputEl: HTMLInputElement;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function runSearch(value: string) {
    results = searchV2(value);
    open = value.trim().length > 0 && results.length > 0;
    activeIndex = -1;
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(query), DEBOUNCE_MS);
  }

  function selectResult(result: ISearchResult) {
    if (result.building) {
      handleSelectBuilding(result.building);
    }
    query = result.name;
    open = false;
    activeIndex = -1;
    inputEl?.blur();
  }

  // When a building/room is selected, the search bar shows a back icon instead.
  $: selected = $mapStatus.selectedBuilding !== undefined;

  // Clear the search input when the selected building/room is unselected
  // (via the back button in this bar or the close button in the info card).
  let wasSelected = false;
  $: {
    if (wasSelected && !selected) {
      query = "";
      open = false;
      activeIndex = -1;
    }
    wasSelected = selected;
  }

  function setFocused(value: boolean) {
    focused = value;
    if (value) open = query.trim().length > 0 && results.length > 0;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === SHORTCUT_KEY && document.activeElement !== inputEl) {
      e.preventDefault();
      inputEl?.focus();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, results.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        selectResult(results[activeIndex]);
      } else if (results[0]) {
        selectResult(results[0]);
      }
    } else if (e.key === "Escape") {
      open = false;
      activeIndex = -1;
      inputEl?.blur();
    }
  }

  async function focusInput() {
    await tick();
    inputEl?.focus();
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
    clearTimeout(debounceTimer);
  });
</script>

<div class="absolute top-4 left-4 z-20 flex flex-col gap-3 pointer-events-auto w-[26rem] max-w-[calc(100vw-2rem)]">
  <!-- Search input bar (FLOATING surface) -->
  <div
    class="bg-white border rounded-2xl shadow-lg flex items-center gap-3 px-4 py-3 transition-all duration-200 {focused
      ? 'border-blue-300 ring-2 ring-blue-500/30'
      : 'border-gray-200'}"
  >
    <!-- Left: back icon when a building/room is selected, else search icon -->
    {#if selected}
      <button
        class="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200 shrink-0"
        title="Back"
        on:click={handleUnselect}
      >
        <svg class="w-5 h-5 shrink-0 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
    {:else}
      <svg
        class="w-5 h-5 shrink-0 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    {/if}

    <input
      bind:this={inputEl}
      bind:value={query}
      on:input={handleInput}
      on:focus={() => setFocused(true)}
      on:blur={() => setFocused(false)}
      type="text"
      placeholder="Search buildings, room ..."
      class="w-full rounded-xl border border-transparent bg-transparent px-0 py-1 text-base placeholder:text-gray-400 outline-none"
    />

    <!-- Right: keyboard shortcut hint -->
    <button
      class="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-500 shrink-0 hover:bg-gray-50 transition-colors duration-200"
      title="Focus search"
      on:click={focusInput}
    >
      {SHORTCUT_KEY === " " ? "Space" : SHORTCUT_KEY}
    </button>
  </div>

  <!-- Results dropdown -->
  {#if open}
    <div class="bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col overflow-hidden">
      <div class="flex flex-col divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {#each results as result, i}
          <SearchResultItemV2
            result={result}
            active={i === activeIndex}
            on:click={() => selectResult(result)}
          />
        {/each}
      </div>
    </div>
  {/if}
</div>