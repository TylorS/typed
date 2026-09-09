<script>
  import Typed from "@typed/svelte/Typed.svelte";

  let { id, runtime, value, settings } = $props();
</script>

<Typed {id} {runtime} value={value} onReady={$settings.onReady} onError={$settings.onError} stopPropagation={$settings.stopPropagation} />
