---
title: "Schedule DOM rendering"
summary: "Change when local DOM work runs without changing what a template owns or how a dynamic part is updated."
section: "Template rendering"
kind: "deep-dive"
order: 93
---

A search producer can publish several result counts during one browser turn. Applying every
intermediate count may add presentation work without making any additional state visible. A render
queue lets already-known local updates wait for an appropriate execution time and coalesce where
their keys and priority agree.

Read [Direct updates, local reconciliation](/explore/dom-updates-and-reconciliation) first. The queue
controls when that work runs; it does not change the owned field, choose application concurrency,
or make a large range diff cheap.

## Scheduling is already available

Scheduling services are always available in the Effect context used by each `RenderTemplate`.
`CurrentRenderQueue` defaults to `MixedRenderQueue`, and `CurrentRenderPriority` defaults to
`RenderPriority.Raf(10)`. Ordinary templates need no queue setup. The DOM renderer uses these
services when scheduling its dynamic parts; server-rendered HTML does not wait for a browser paint.

`MixedRenderQueue` routes work to synchronous, animation-frame, or idle scheduling according to its
priority. Where frame or idle callbacks are unavailable, those lanes use timer-based fallbacks.

## Set the priority of a specific template

Wrap a template in `Fx.provideService(CurrentRenderPriority, ...)` to control when its DOM updates
run. Here both outputs observe the same state, but only the first uses synchronous updates:

```ts
import { Fx, RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";
import { CurrentRenderPriority } from "@typed/template/Render";
import { RenderPriority } from "@typed/template/RenderQueue";

export const Counter = component(function* () {
  const count = yield* RefSubject.make(0);

  // Apply updates to this output immediately.
  const immediate = html`<output aria-label="Immediate count">${count}</output>`.pipe(
    Fx.provideService(CurrentRenderPriority, RenderPriority.Sync),
  );

  // This sibling retains the default animation-frame priority.
  const framed = html`<output aria-label="Frame count">${count}</output>`;

  return html`
    <section>
      <button onclick=${RefSubject.increment(count)}>Increment</button>
      <p>Immediate: ${immediate}</p>
      <p>Next frame: ${framed}</p>
    </section>
  `;
});
```

Render `Counter` with your usual `DomRenderTemplate` setup. The override applies to the wrapped
template and templates rendered inside its context; siblings keep their surrounding priority.
A nested template can provide its own priority. Use `RenderPriority.Raf(5)` for earlier frame work
or `RenderPriority.Idle(1)` for nonessential background presentation in the same way. These overrides
reuse the current queue; they do not create a queue per template or change how `count` publishes.

## Keep publication separate from presentation

Imagine a count publishing `10`, `11`, and `12` before the next visual frame. If each pending update
uses the same queue key and priority, the newest replaces the earlier entry. The DOM can move from
its previous count directly to `12`. The source still published all three values; its business
Effects were not necessarily batched or canceled.

## Choose priority by the interaction's requirement

`RenderPriority.Sync` is immediate work. `Raf(n)` expresses visual-frame work, and `Idle(n)` expresses
background work. Lower numeric priorities run first within their scheduling lane.

Sync is useful when a small native update must be observable immediately, especially in deterministic
DOM tests. It can also move expensive work onto an interaction's call stack. Frame scheduling aligns
presentation work with a visual opportunity but cannot guarantee the callback will fit the frame
budget. Idle work must genuinely tolerate waiting.

A queue callback finishing does not mean layout or paint has completed. Measurements and focus
policies that require connection or geometry need their own platform coordination.

## Use a synchronous policy for captured-field tests

For a test that asserts an applied DOM value, provide `RenderPriority.Sync` to the template as
above. The assertion then need not guess how long a frame will take. This does not make an
asynchronous producer synchronous: coordinate with its actual publication before checking the DOM.

For custom schedulers, queue replacement, cancellation, and lower-level task bookkeeping, use the
[RenderQueue reference](/reference/modules/%40typed%2Ftemplate%2FRenderQueue). Those extension
contracts are separate from choosing when a component's captured DOM updates run.
