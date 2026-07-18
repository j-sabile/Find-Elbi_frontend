<script lang="ts">
  import { COLLEGES, TYPES, type IFloor } from "../../data/constants";
  import { drawBuildingStore, selectedSection } from "../../stores/drawBuilding";
  import { get } from "svelte/store";
  import FloorCreator from "./FloorCreator.svelte";

  export let centroid: [number, number];
  export let polygonPoints: [number, number][];
  export let generatedId: string = "";

  let name = "";
  let type = TYPES.ACADEMIC;
  let college = COLLEGES.CAS;
  let alternateNamesStr = "";
  let address = "";
  let floors: IFloor[] = [{ levelIndex: 0, label: "Ground Floor", rooms: [] }];

  $: isBuildingSaved = $drawBuildingStore.building !== null;

  $: alternateNames = alternateNamesStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  $: codeBlock = generateCodeBlock(generatedId, name, type, college, alternateNames, address, centroid, polygonPoints);

  function generateCodeBlock(
    idVal: string,
    nameVal: string,
    typeVal: TYPES,
    collegeVal: COLLEGES,
    altNamesVal: string[],
    addressVal: string,
    centroidVal: [number, number],
    polygonPtsVal: [number, number][],
  ): string {
    const isAcademic = typeVal === TYPES.ACADEMIC;
    const formattedAlts = altNamesVal.length > 0 ? `[${altNamesVal.map((n) => `"${n}"`).join(", ")}]` : "[]";
    const formattedPolygon = polygonPtsVal.length > 0 ? `[\n${polygonPtsVal.map((p) => `      [${p[0]}, ${p[1]}]`).join(",\n")}\n    ]` : "[]";

    return `  {
    id: "${idVal}",
    name: "${nameVal || "Unnamed Building"}",
    type: TYPES.${Object.keys(TYPES).find((k) => TYPES[k as keyof typeof TYPES] === typeVal) || "ACADEMIC"},
${isAcademic ? `    college: COLLEGES.${Object.keys(COLLEGES).find((k) => COLLEGES[k as keyof typeof COLLEGES] === collegeVal) || "CAS"},\n` : ""}    alternateNames: ${formattedAlts},
    address: "${addressVal || "Unknown Road"}",
    marker: [${centroidVal[0]}, ${centroidVal[1]}],
    polygon: ${formattedPolygon},
  },`;
  }

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
      sections: $drawBuildingStore.sections,
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
    disabled={isBuildingSaved}
  />

  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="text-xs text-gray-500 font-medium">Building Type</label>
  <select class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 outline-none" bind:value={type} disabled={isBuildingSaved}>
    {#each Object.values(TYPES) as t}
      <option value={t}>{t}</option>
    {/each}
  </select>

  {#if type === TYPES.ACADEMIC}
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="text-xs text-gray-500 font-medium">College</label>
    <select class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 outline-none" bind:value={college} disabled={isBuildingSaved}>
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
    disabled={isBuildingSaved}
  />

  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="text-xs text-gray-500 font-medium">Alternate Names</label>
  <input
    type="text"
    class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g. Physci"
    bind:value={alternateNamesStr}
    disabled={isBuildingSaved}
  />

  <FloorCreator bind:floors />

  <div class="flex flex-row gap-2 mt-2">
    {#if isBuildingSaved}
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
      disabled={polygonPoints.length < 3 || isBuildingSaved}
      on:click={handleSave}
    >
      {isBuildingSaved ? "Building Saved" : "Save Building"}
    </button>
  </div>
</div>
