<script lang="ts">
  import { fly } from "svelte/transition";
  import { createEventDispatcher } from "svelte";
  import { X } from "lucide-svelte";

  export let title: string;
  export let closeOnOutside = false;
  export let showClose = closeOnOutside;
  export let width = "w-fit";

  const dispatch = createEventDispatcher();

  function clickOutside(node: HTMLElement) {
    if (!closeOnOutside) return {};
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (node && !node.contains(target) && !target.closest('[title="Basemaps"]')) {
        dispatch("close");
      }
    };
    document.addEventListener("click", handler, true);
    return {
      destroy() {
        document.removeEventListener("click", handler, true);
      },
    };
  }
</script>

<div class="bg-white border border-gray-200 rounded-2xl shadow-lg {width} p-4 flex flex-col gap-4" use:clickOutside transition:fly={{ y: 20, duration: 250 }}>
  <div class="flex items-center justify-between gap-3">
    <span class="text-lg font-semibold tracking-tight text-gray-900">{title}</span>
    {#if showClose}
      <button
        class="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200"
        title="Close"
        on:click={() => dispatch("close")}
      >
        <X class="w-5 h-5 shrink-0 text-gray-700" />
      </button>
    {/if}
  </div>

  <slot />
</div>
