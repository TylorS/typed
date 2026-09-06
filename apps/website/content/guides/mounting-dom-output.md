---
title: "Mounting DOM output"
summary: "Render a live RenderEvent Fx into one real browser root with an explicit lifetime."
section: "Template rendering"
kind: "guide"
order: 1
---

An existing page can host a Typed search panel beside a static header and another library's chart.
The important integration decision is where the panel may write and how long its work should run.
Choose a dedicated host and let the outer application own the render's fiber.

[Render your first template](/explore/render-your-first-template) introduces the entry point.
This page turns that entry into a lifecycle boundary suitable for a router, custom element, or
another application embedding Typed output.

For a native custom element whose connections, attributes, shadow root, and server output should
share one definition, use the [Web Component integration recipe](/integrate/web-component). For an
Astro island, use [Typed templates in Astro](/integrate/astro), which lets Astro own page markup and
hydration scheduling while Typed owns the island's Scope.

## Make the writable boundary visible in the document

Give the panel an element such as `<div id="article-search"></div>`. The static header and chart
should be siblings outside it. Fresh nonempty root output is placed with `replaceChildren`, so
unrelated children inside that same host are not protected from root replacement.

A template's _internal_ scalar updates are narrower: typing in a captured input part does not emit
a new root or replace the host. The host boundary matters when root output is first placed or
actually replaced, not on every state change.

## Return a mount Effect to the owner

A reusable mounting function should describe the work, not secretly start it:

```ts
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { DomRenderTemplate, html, render } from "@typed/template";
import * as EventHandler from "@typed/template/EventHandler";

const SearchPanel = component(function* () {
  const query = yield* RefSubject.make("");
  const readQuery = EventHandler.make((event: Event) =>
    RefSubject.set(query, (event.currentTarget as HTMLInputElement).value),
  );
  return html`<section>
    <label>Search articles <input type="search" .value=${query} oninput=${readQuery} /></label>
    <output>${query}</output>
  </section>`;
});

export const mountSearch = (host: HTMLElement) => SearchPanel.pipe(
  render(host),
  Fx.drain,
  Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
  Effect.scoped,
);
```

The component owns setup for one running panel. Its scope includes the subject and template
subscriptions. `render(host)` handles placement. `Fx.drain` exposes the live render as Effect work
that its caller can supervise. The renderer's document is taken from the actual host, which matters
for tests and iframes.

This does not redirect every browser global used by your callbacks. If an integration needs the
host document's window or constructors, derive those explicitly in that integration too.

## Start and stop at the platform boundary

Here is the same ownership pattern with a static view so the entry is independently runnable:

```ts
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const host = document.getElementById("article-search");
if (host === null) throw new Error("Missing article-search host");

const application = html`<aside>Search your saved articles here.</aside>`.pipe(
  render(host),
  Fx.drain,
  Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
  Effect.scoped,
);
const fiber = Effect.runFork(application);
export const stop = () => Effect.runPromise(Fiber.interrupt(fiber));
```

The owner keeps `fiber`, observes failures according to its application policy, and calls `stop`
during route or panel teardown. Do not start `runFork` inside the view or ref: that hides work from
the owner that is supposed to stop it.

[Scope closure](https://github.com/Effect-TS/effect/blob/main/packages/effect/src/Scope.ts) releases
subscriptions, listeners, queued callbacks, and acquired finalizers. It is
not a universal promise to empty every host or dispose arbitrary borrowed nodes. If teardown needs
an empty slot, the host can clear its dedicated children after interruption. A foreign editor must
supply its own scoped teardown in its producer; `DomRenderEvent` is not a disposer.

## Choose supervision rather than accidental background work

`Fx.drainLayer` is useful when a Layer graph deliberately owns background rendering. It forks the
source; a later child-fiber failure does not retroactively fail Layer acquisition. Handle/report
errors in the source if that is the intended pattern. Use the direct `Fx.drain` Effect when the
caller needs to supervise the render's exit.

Starting a second render for a reused host before closing the first can leave two programs competing
for children and events. Make stopping the old owner part of replacement, rather than inferring
cleanup because its old nodes disappeared from the document.

## Adoption uses the same host contract

If the host already contains compatible Typed server output, `render` creates the hydration context
and can adopt its existing nodes. Render the same inner view the server put inside that host, not
the full response document. Clearing the host before starting removes the evidence adoption needs.

Test three boundaries independently: a foreign sibling remains untouched, scalar edits retain the
panel's input object, and events stop running after interruption. For SSR add the stronger assertion
that the first client input is the original server input. Retain an old detached button and dispatch
after teardown to detect leaked work that a screenshot would miss.

Continue with [Hydrating Typed HTML](/explore/hydrating-typed-html) for compatibility diagnosis and
[Using DomRenderEvent](/explore/dom-render-event) for scoped foreign output. The
[Render reference](/reference/modules/%40typed%2Ftemplate%2FRender) is the public mounting boundary.
