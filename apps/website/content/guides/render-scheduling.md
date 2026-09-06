---
title: "Schedule DOM rendering"
summary: "Change when local DOM work runs without changing what a template owns or how a dynamic part is updated."
section: "Template rendering"
kind: "deep-dive"
order: 7
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
import { html } from "@typed/template";
import { CurrentRenderPriority } from "@typed/template/Render";
import { RenderPriority } from "@typed/template/RenderQueue";

export const Counter = Fx.gen(function* () {
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

The queue entry contains a key, task, cleanup callback, and numeric priority. Cleanup releases
entry bookkeeping after execution or supersession. It should not undo the visual value immediately
after the task writes it.

```ts
import { MixedRenderQueue, RenderPriority } from "@typed/template/RenderQueue";

const output = document.createElement("output");
const queue = new MixedRenderQueue();

queue.add(
  output,
  () => { output.value = "12 results"; },
  () => { /* No additional pending-entry resources to release. */ },
  RenderPriority.Raf(5),
);
```

This lower-level example supplies an already-known output element as its key. A renderer does the
same kind of scheduling around its captured parts. Application components normally use the supplied
renderer policy rather than enqueue individual DOM mutations themselves.

## Choose priority by the interaction's requirement

`RenderPriority.Sync` is immediate work. `Raf(n)` expresses visual-frame work, and `Idle(n)` expresses
background work. Lower numeric priorities run first. Reusing a key at a *different* priority does
not automatically cancel its entry in another bucket; test that explicitly if an extension changes
priority dynamically.

Sync is useful when a small native update must be observable immediately, especially in deterministic
DOM tests. It can also move expensive work onto an interaction's call stack. Frame scheduling aligns
presentation work with a visual opportunity but cannot guarantee the callback will fit the frame
budget. Idle work must genuinely tolerate waiting.

A queue callback finishing does not mean layout or paint has completed. Measurements and focus
policies that require connection or geometry need their own platform coordination.

## Override the queue at the rendering boundary

For a custom scheduler or a deterministic test environment, override `CurrentRenderQueue` at the
rendering boundary. This is optional: changing one template's priority only needs the
`Fx.provideService` wrapper above. The following setup replaces the mixed queue with a
`SyncRenderQueue` for all rendering inside the provided context:

```ts
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { CurrentRenderPriority, CurrentRenderQueue } from "@typed/template/Render";
import { RenderPriority, SyncRenderQueue } from "@typed/template/RenderQueue";

const view = html`<output>Search ready</output>`;
const services = Layer.mergeAll(
  DomRenderTemplate,
  Layer.succeed(CurrentRenderQueue, new SyncRenderQueue()),
  Layer.succeed(CurrentRenderPriority, RenderPriority.Sync),
);

export const mountForTest = (host: HTMLElement) => view.pipe(
  render(host),
  Fx.drain,
  Effect.provide(services),
  Effect.scoped,
);
```

The renderer still owns the callbacks scheduled for its parts and disposes them with their scope.
The queue owns its active scheduler and pending buckets. Disposing a queue cancels that scheduler
and drops pending work; it is not a general teardown operation for already-rendered output.
A returned entry Disposable can cancel pending work at the lower-level API boundary.

## Test the scheduling decision rather than a guessed delay

For a captured-field assertion, a sync policy removes frame timing from the test. Test a custom
coalescing queue separately: add two tasks with the same key/priority, advance its scheduler,
assert only the newest runs, and assert the superseded cleanup happens. Also test cancellation and
same-key/different-priority behavior if an extension relies on them.

In a performance trace, separate producer computation, time waiting in the queue, mutation callback
execution, and browser layout/paint. If the producer rebuilds a thousand result records, changing
queue policy does not eliminate that computation. If a local range change triggers expensive
layout, delaying it does not make it scalar.

Use the [RenderQueue reference](/reference/modules/%40typed%2Ftemplate%2FRenderQueue) when building
a scheduler or directive. Keep ordinary UI state and event concurrency in the producing application;
[Native events with Effect](/explore/native-events-with-effect) describes that distinct boundary.
