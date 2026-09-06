<script>
  import { html } from "@typed/template/RenderTemplate";
  import Typed from "@typed/svelte/Typed.svelte";
  let { label, onReady } = $props();
  // The label is a Typed RefSubject on the client and has its own subscription.
  // svelte-ignore state_referenced_locally
  const child = html`<button data-round-trip>${label}</button>`;
</script>

<section><Typed view={child} {onReady} /></section>
