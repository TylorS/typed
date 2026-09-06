<script lang="ts" generics="V extends Renderable.Any, ER = never">
  import type { Renderable } from "@typed/template/Renderable";
  import type { TypedProps } from "./Typed.js";
  import { attachment } from "./Attachment.js";
  import { useRuntime } from "./Runtime.js";
  import { renderSnapshot } from "./internal/RenderSnapshot.js";
  import type { Scope } from "effect/Scope";
  import type { RenderTemplate } from "@typed/template/RenderTemplate";
  import { rootEvents } from "@typed/template/RootEvents";
  import { Cause, Exit, Layer } from "effect";

  let { runtime, view, id, onError, onReady, stopPropagation }: TypedProps<V, ER> = $props();
  const componentId = $props.id();

  const inherited = useRuntime<Exclude<Exclude<Renderable.Services<V>, RenderTemplate>, Scope>, ER>();
  // $inherited subscribes to the runtime store and follows provider replacements.
  const selectedRuntime = $derived(runtime ?? $inherited);

  const report = (root: HTMLElement, cause: Cause.Cause<Renderable.Error<V> | ER>) => {
    if (onError) onError(cause);
    else root.dispatchEvent(new CustomEvent("typed:error", { detail: cause }));
  };

  const render = $derived.by(() => {
    const selected = selectedRuntime;
    const current = view;

    return (root: HTMLElement) => attachment(selected, current, {
      stopPropagation: false,
      onError: (cause) => report(root, cause),
      onReady: () => onReady?.(),
    })(root);
  });

  const events = $derived.by(() => {
    const selected = selectedRuntime;
    const policy = stopPropagation;

    return (root: HTMLElement) => {
      const fiber = selected.runFork(rootEvents(root, policy).pipe(
        Layer.effectDiscard,
        Layer.launch,
      ));

      fiber.addObserver((exit) => {
        if (Exit.isFailure(exit) && !Cause.hasInterruptsOnly(exit.cause)) report(root, exit.cause);
      });

      return () => fiber.interruptUnsafe();
    };
  });

  // The host separates Typed's output from the surrounding Svelte component.
  // Keep the server snapshot fixed; subsequent updates belong to Typed.
  // svelte-ignore state_referenced_locally
  const initialHtml = await renderSnapshot(selectedRuntime, view);
</script>

<div id={id ?? componentId} style="display: contents" {@attach render} {@attach events}>
  <!-- Svelte retains SSR HTML at this opaque boundary; Typed owns subsequent updates. -->
  <!-- svelte-ignore hydration_html_changed -->
  {@html initialHtml}
</div>
