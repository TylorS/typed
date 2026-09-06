<script lang="ts">
  import { onMount } from "svelte";

  let { label, onMounted = () => {}, onDestroyed = () => {} }: {
    label: string;
    onMounted?: () => void;
    onDestroyed?: () => void;
  } = $props();
  let count = $state(0);
  const instanceId = $props.id();

  onMount(() => {
    onMounted();
    return onDestroyed;
  });
</script>

<svelte:head>
  <title>{label}</title>
</svelte:head>

<button id={instanceId} data-stateful onclick={() => count++}>{label}:{count}</button>
