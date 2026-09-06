<script>
  let { message } = $props();
  // svelte-ignore state_referenced_locally
  throw new Error(message);
</script>
