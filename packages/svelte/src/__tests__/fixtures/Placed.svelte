<script lang="ts">
  import { onMount } from "svelte";

  let { onMounted }: {
    onMounted: (state: { connected: boolean; width: number; focused: boolean }) => void;
  } = $props();
  let input: HTMLInputElement;

  onMount(() => {
    input.focus();
    onMounted({
      connected: input.isConnected,
      width: input.getBoundingClientRect().width,
      focused: document.activeElement === input,
    });
  });
</script>

<input data-placement bind:this={input} style="width: 160px" />
