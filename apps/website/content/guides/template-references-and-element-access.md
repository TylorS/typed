---
title: "Reference the native element"
summary: "Use ref for the small set of browser integrations that need the exact element, with cleanup tied to the ref lifetime."
section: "Template bindings"
kind: "guide"
order: 5
---

<span id="use-hydration-refs-for-state-that-crosses-the-response-boundary"></span>

Use `ref` when a browser API needs the element itself. Its callback receives the native element
and can return an Effect, Fx, or Stream whose lifetime the renderer owns. A nullish ref does
nothing; mutable ref objects, strings, and DOM nodes are not this callback protocol.

For fields and listeners, use [scalar bindings](/explore/template-element-bindings) and
[native events](/explore/native-events-with-effect) directly.

The renderer invokes the ref while preparing fresh output or wiring adopted output. A fresh element
may not yet be inserted into the outer host. Element availability therefore does not imply layout,
paint, focusability, or connection. Do not treat a ref as an after-paint callback.

## Tie an observer to the element's running lifetime

A results panel can report its width through `ResizeObserver`. The browser observer has a resource
lifetime that must end when the view ends:

```ts
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";

// Adapt only the browser subscription; rendering stays in the template.
const widths = (element: HTMLElement) => Fx.callback<number>((emit) => {
  const observer = new ResizeObserver(([entry]) => {
    if (entry) emit.succeed(entry.contentRect.width);
  });

  observer.observe(element);

  return Effect.sync(() => observer.disconnect());
});

export const results = component(function* () {
  const width = yield* RefSubject.make<number | null>(null);

  const measurePanel = (element: HTMLElement) => widths(element).pipe(
    Fx.tap((value) => RefSubject.set(width, value)),
  );

  return html`<section aria-label="Search results" ref=${measurePanel}>
    <output>${RefSubject.map(width, (value) =>
      value === null ? "Waiting for measurement" : `Panel width: ${Math.round(value)}px`)}</output>
  </section>`;
});
```

The ref returns an Fx. The renderer drains it within the ref's scope, and `Fx.callback` disconnects
the observer when that subscription ends. The callback publishes measurements; the template owns
the displayed text. No selector or manual text/style mutation connects the two.

A ref may also return an Effect or Effect Stream. Use `Effect.acquireRelease` for an Effect that
acquires a resource and finishes setup while keeping the resource alive until scope closure.
Returning a plain JavaScript cleanup function is not a cleanup protocol. Error and service
requirements remain visible to the template.

A library requiring a connected host also needs explicit mount coordination; adding a guessed
timeout does not establish connection or layout readiness. ResizeObserver delivers measurements
when the browser has geometry to report. Until then, the view explicitly displays its waiting state.

## Distinguish retained elements from replaced capabilities

Changing a sibling text part does not reinstall the ref. A retained keyed child keeps its existing
ref setup when it moves. Removing the child closes its scope. Replacing the whole template creates
a new element and a new setup lifetime.

A spread can contain the same `ref` callback. Removing that key closes the ref's resource even if
the host element remains. This is useful for enabling and disabling a feature with a shorter lifetime
than the panel. [Spread props and data records](/explore/template-spreads-data) explains that per-key
ownership.

## Check resource cleanup

For the observer, count acquisition and finalization across keyed removal and spread-ref removal.
Assert that the callback receives the expected native object and that its observer disconnects
when the ref ends.

## Hydrated state is a separate handoff

Ordinary refs produce no server HTML. Hydration refs have a separate state-transfer contract:
see [Hydrated template state](/explore/refsubject-template-hydration) for `RefSubject.hydrate`
and combining state refs on one host.
