<script>
  import Typed from "@typed/svelte/Typed.svelte";

  let { id, runtime, view, settings } = $props();
</script>

<Typed {id} {runtime} {view} onReady={$settings.onReady} onError={$settings.onError} stopPropagation={$settings.stopPropagation} />
