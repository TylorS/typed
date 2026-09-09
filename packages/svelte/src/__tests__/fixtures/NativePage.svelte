<script>
  import Typed from "@typed/svelte/Typed.svelte";
  let { value, runtime } = $props();
</script>

<main data-native-page><Typed {value} {runtime} /></main>
