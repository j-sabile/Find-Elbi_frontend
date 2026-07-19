<script lang="ts">
  import { COLLEGES, type IFloor, BUILDING_TYPES } from "../../data/constants";
  import { drawBuildingStore, selectedSection } from "../../stores/drawBuilding";
  import { get } from "svelte/store";
  import FloorCreator from "./FloorCreator.svelte";

  export let polygonPoints: [number, number][];

  let name = "";
  let type = BUILDING_TYPES.ACADEMIC;
  let college = COLLEGES.CAS;
  let alternateNamesStr = "";
  let address = "";
  let floors: IFloor[] = [{ levelIndex: 0, label: "Ground Floor", rooms: [] }];

  $: isEditing = $drawBuildingStore.isEditingBuilding;

  $: alternateNames = alternateNamesStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function handleSave() {
    console.log(`calling drawBuildingStore.updateBuilding()`);
    const currentSection = get(selectedSection);
    if (currentSection === null) return;

    drawBuildingStore.updateBuilding({
      name: name,
      alternateNames: alternateNames,
      floors: floors,
      address: address,
      type: type,
      college: college,
      polygon: currentSection.polygon,
      // sections: $drawBuildingStore.building.sections,
    });
  }
</script>

<div class="flex flex-col gap-3">
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="text-xs text-gray-500 font-medium">Building Name</label>
  <input
    type="text"
    class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g. CAS Annex 3"
    bind:value={name}
    disabled={!isEditing}
  />

  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="text-xs text-gray-500 font-medium">Building Type</label>
  <select class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 outline-none" bind:value={type} disabled={!isEditing}>
    {#each Object.values(BUILDING_TYPES) as t}
      <option value={t}>{t}</option>
    {/each}
  </select>

  {#if type === BUILDING_TYPES.ACADEMIC}
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="text-xs text-gray-500 font-medium">College</label>
    <select class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 outline-none" bind:value={college} disabled={!isEditing}>
      {#each Object.values(COLLEGES) as t}
        <option value={t}>{t}</option>
      {/each}
    </select>
  {/if}

  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="text-xs text-gray-500 font-medium">Address</label>
  <input
    type="text"
    class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g. Victoria M. Ela Avenue"
    bind:value={address}
    disabled={!isEditing}
  />

  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="text-xs text-gray-500 font-medium">Alternate Names</label>
  <input
    type="text"
    class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g. Physci"
    bind:value={alternateNamesStr}
    disabled={!isEditing}
  />

  <FloorCreator bind:floors />

  <div class="flex flex-row gap-2 mt-2">
    {#if !isEditing}
      <button
        class="inline-flex items-center w-full justify-center gap-2 rounded-lg text-black border-2 px-4 py-2 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition-colors duration-200"
        disabled={polygonPoints.length < 3}
        on:click={handleSave}
      >
        Edit Buidling
      </button>
    {/if}
    <button
      class="inline-flex items-center w-full justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
      disabled={polygonPoints.length < 3 || !isEditing}
      on:click={handleSave}
    >
      {isEditing ? "Save Building" : "Building Saved"}
    </button>
  </div>
</div>
