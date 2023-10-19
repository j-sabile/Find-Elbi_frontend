<script>
  import { slide } from "svelte/transition";

  export let classes = "";
  export let closed = true;
  let pillExtended = false;
</script>

<div class="flex flex-col absolute bg-white w-full box-border rounded-t-2xl bottompane {closed ? '' : pillExtended ? 'extended' : 'semi-extended'} {classes}" transition:slide>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="w-full bg-white rounded-t-2xl flex justify-center cursor-pointer" on:click={() => (pillExtended = !pillExtended)}>
    <div class="pill bg-neutral-300 rounded-full shadow-sm m-2" />
  </div>
  <div class="w-full overflow-auto">
    <slot />
  </div>
</div>

<style>
  .bottompane {
    bottom: 0px;
    height: 0px;
    transition: height 0.3s ease-in-out;
  }

  .pill {
    height: 5px;
    width: 40px;
  }

  .semi-extended {
    height: 150px;
  }
  .extended {
    height: calc(100vh - 60px);
  }
</style>
