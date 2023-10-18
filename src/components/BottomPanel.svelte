<script>
  export let classes = "";
  let pillExtended = false;
</script>

<div class="bottom-pane{pillExtended ? '-extended' : ''} flex flex-col bg-slate relative z-10 {classes}">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="pill-holder absolute bg-white w-full flex justify-center rounded-t-full items-center" on:click={() => (pillExtended = !pillExtended)}>
    <div class="pill h-1 w-7 bg-slate-200 rounded-full my-1 shadow-sm" />
  </div>
  <slot />
</div>

<style>
  .bottom-pane {
    max-height: 100px;
  }
  .bottom-pane-extended {
    min-height: calc(100vh - 80px);
  }
  .pill-holder {
    height: 20px;
    top: -19px;
  }
</style>
