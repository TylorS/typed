<script lang="ts">
  import { Effect } from "effect";
  import { html } from "@typed/template";
  import { attachment } from "../../Attachment.js";
  import type { Runtime } from "../../Runtime.js";

  let { runtime, onAcquire = () => {}, onRelease = () => {} }: {
    runtime: Runtime<never>;
    onAcquire?: () => void;
    onRelease?: () => void;
  } = $props();
  let label = $state("one");

  const lifecycle = () =>
    Effect.acquireRelease(
      Effect.sync(onAcquire),
      () => Effect.sync(onRelease),
    );

  const typedView = $derived.by(
    () => html`<span data-typed-child ref=${lifecycle}>${label}</span>`,
  );
</script>

<button data-update onclick={() => (label = "two")}>update</button>
<div data-attachment {@attach attachment(runtime, typedView)}></div>
