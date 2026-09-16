---
title: "Mounting DOM output"
summary: "Embed a live view at one owned browser root with a single explicit lifetime."
section: "Template rendering"
kind: "guide"
order: 1
---

A Typed view writes inside a dedicated host for as long as its render Effect runs.
The outer application chooses that writable boundary and stops rendering when the view closes.
Keep the render's fiber with that owner.

[Render your first template](/explore/render-your-first-template) introduces the entry point.
This page turns that entry into a lifecycle boundary suitable for a router, custom element, or
another application embedding Typed output.

For a native custom element whose connections, attributes, shadow root, and server output should
share one definition, use the [Web Component integration recipe](/integrate/web-component). For an
Astro island, use [Typed templates in Astro](/integrate/astro), which lets Astro own page markup and
hydration scheduling while Typed owns the island's Scope.

## Make the writable boundary visible in the document

Give the panel an element such as `<div id="panel"></div>`. Unrelated content
should be outside it. Fresh nonempty root output is placed with `replaceChildren`, so
unrelated children inside that same host are not protected from root replacement.

A template's _internal_ scalar updates are narrower: typing in a captured input part does not emit
a new root or replace the host. The host boundary matters when root output is first placed or
actually replaced, not on every state change.

## Return a mount Effect to the owner

A reusable mounting function should describe the work, not secretly start it:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const panel = html`<button onclick=${Effect.log("Clicked")}>Click</button>`;

export const mountPanel = (host: HTMLElement) => panel.pipe(
  render(host),
  Fx.drain,
  Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
  Effect.scoped,
);
```

The mount scope owns the panel's event handler and template subscriptions. `render(host)` handles
placement. `Fx.drain` exposes the live render as Effect work
that its caller can supervise. The renderer's document is taken from the actual host, which matters
for tests and iframes.

This does not redirect every browser global used by your callbacks. If an integration needs the
host document's window or constructors, derive those explicitly in that integration too.

## Start and stop at the platform boundary

The owner runs `mountPanel(host)`, keeps its fiber, observes failures according to application
policy, and interrupts it during route or panel teardown. Do not start `runFork` inside the view or
ref: that hides work from the owner that is supposed to stop it.

[Scope closure](https://github.com/Effect-TS/effect/blob/main/packages/effect/src/Scope.ts) releases
subscriptions, listeners, queued callbacks, and acquired finalizers. It is
not a universal promise to empty every host or dispose arbitrary borrowed nodes. If teardown needs
an empty slot, the host can clear its dedicated children after interruption. A foreign editor must
supply its own scoped teardown in its producer; `DomRenderEvent` is not a disposer.

For deliberate background rendering owned by a Layer graph, see
[`Fx.drainLayer`](/reference/modules/%40typed%2Ffx%2FFx). Use the direct `Fx.drain` Effect above
when the caller needs to supervise the render's exit.

Starting a second render for a reused host before closing the first can leave two programs competing
for children and events. Make stopping the old owner part of replacement, rather than inferring
cleanup because its old nodes disappeared from the document.

## Verify the mount boundary

Check that a foreign sibling remains untouched and that the button's handler stops after
interruption. Dispatch on the retained button after teardown to detect leaked work, even if the
host has been cleared.

If the host contains compatible Typed server output, render the same inner view without clearing
it first. [Hydrating Typed HTML](/explore/hydrating-typed-html) covers adoption.
[Using DomRenderEvent](/explore/dom-render-event) covers scoped foreign output; the
[Render reference](/reference/modules/%40typed%2Ftemplate%2FRender) defines the mounting API.
