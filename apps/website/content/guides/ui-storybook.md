---
title: "Storybook: mount a story with an owned render scope"
summary: "Supply application services, await visible output, and dispose every mounted story."
section: "UI / Foundations"
kind: "deep-dive"
order: 296
---

A component explorer repeatedly mounts, replaces, and removes UI. The difficult integration is lifetime: old listeners and fibers must end when a story leaves its canvas. `@typed/ui/Storybook.mount` provides a browser mount adapter returning a canvas and an explicit asynchronous disposer.

Read [Component](/explore/ui-component) and [mounting DOM output](/explore/mounting-dom-output) first. This helper is not a Storybook configuration generator or a complete Component Story Format abstraction. Storybook's own [writing stories guide](https://storybook.js.org/docs/writing-stories) describes how stories and render functions are organized.

[Open the UI Storybook](/explore/storybook) to try the maintained components, edit available props, and inspect their keyboard and accessibility behavior.

## Mount an interactive fixture

The function below is suitable for an explorer or browser fixture that wants to own the returned canvas. It provides a real stateful interaction and exposes cleanup to the caller.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import { mount } from "@typed/ui/Storybook";

const CounterStory = component(function* () {
  const count = yield* RefSubject.make(0);
  return html`<section aria-label="Counter example">
    <button type="button" onclick=${RefSubject.update(count, (value) => value + 1)}>Add item</button>
    <output aria-live="polite">${count} items</output>
  </section>`;
});

export async function showCounterStory(container: HTMLElement) {
  const story = await mount(CounterStory, container.ownerDocument);
  container.append(story.canvas);
  return async () => {
    await story.dispose();
    story.canvas.remove();
  };
}
```

Call the returned function when replacing the fixture. The mount helper waits for the first DOM render notification before resolving; it does not wait for every asynchronous application operation to settle. Browser tests should wait for the behavior they exercise, such as the output changing after a click, rather than using fixed sleeps.

## Provide the services a story actually needs

`mount` accepts `Fx<RenderEvent, E, Scope | RenderTemplate>`. It supplies a DOM renderer for the chosen document and creates the render Scope. Any application services must already be supplied to the Fx before calling it. This signature catches a story that accidentally depends on a production service absent from the explorer.

E is allowed: a failure before the first render rejects mounting and triggers cleanup. A story that completes without rendering also rejects. Do not use a cast to hide service requirements or a failed fixture. Construct deterministic fake services with the same public contract, then provide them at the story boundary. Use separate fixtures for meaningful empty, loading, error, and populated states.

## Understand disposal and document boundaries

The returned `dispose` is idempotent. It interrupts the render fiber and closes the Scope, releasing render-owned resources. Removing the canvas is a separate DOM operation; explicit disposal alone is not described as removing the canvas from its parent.

The helper also observes document mutations. Once its canvas has been connected, later removal triggers automatic disposal. A never-connected canvas cannot rely on that transition, and environments without MutationObserver receive no such fallback. Explicit disposal remains the reliable ownership contract for tests and integrations.

Pass the intended document when rendering into an iframe or alternate window. The helper creates its canvas and DOM renderer from that document. Refs, native dialogs, popovers, and element classes can be document-sensitive; test them in the same environment users will encounter. Opening a native dialog during first render may need the host to be connected, so do not treat a detached first-render canvas as proof of all native interaction behavior.

## Turn the fixture into useful evidence

A story shows a concrete interaction, not automatic accessibility conformance. Test keyboard focus and activation, labels, disabled behavior, and disposal where relevant. For delayed overlays, remove the story during a pending delay and confirm no later UI effect survives. For external subscriptions, observe finalization rather than merely checking that an element vanished.

If mount hangs, inspect whether the source emits renderable output. If it rejects immediately, inspect the original failure and required services. If behavior duplicates after navigation between stories, inspect the owner of the old fixture and whether its dispose function was retained and called.

Continue with [testing Typed systems](/explore/testing-typed-systems) and the specific [Dialog](/explore/ui-dialog) or [Composite](/explore/ui-composite) guide for browser assertions. API: [Storybook.mount and MountedStory](/reference/modules/%40typed%2Fui%2FStorybook).
