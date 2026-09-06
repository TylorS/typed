<script>
  import Typed from "@typed/svelte/Typed.svelte";
  let { view, runtime } = $props();
</script>

<main data-native-page><Typed {view} {runtime} /></main>
