---
title: "Reference the native element"
summary: "Use ref for the small set of browser integrations that need the exact element, with an Effect-owned lifetime and explicit hydration behavior."
section: "Template bindings"
kind: "guide"
order: 5
---

Most field behavior belongs in attributes, properties, and events. An element reference becomes
necessary when a browser API needs the element object itself—for example, observing a results panel's
size or creating a foreign editor on its host. `ref` attaches that setup to the concrete template
instance and lets Effect own the resource lifetime.

Read [Native events with Effect](/explore/native-events-with-effect) before using a ref merely to
install an event listener. A named event part already expresses that job more precisely.

## Keep ordinary fields declarative

An element reference is unnecessary for attributes and properties the template already supports:

```ts
import { html } from "@typed/template";

export const search = html`<input
  type="search"
  aria-label="Search articles"
  autocomplete="off"
  aria-keyshortcuts="Meta+K"
/>`;
```

Use `ref` when an API needs the element itself. A direct ref accepts a function receiving that
native element, or a nullish value to do nothing. A mutable ref-shaped object, string, or DOM node
is not this protocol.

The renderer invokes the ref while preparing fresh output or wiring adopted output. A fresh element
may not yet be inserted into the outer host. Element availability therefore does not imply layout,
paint, focusability, or connection. Do not treat a ref as an after-paint callback.

## Tie an observer to the element's running lifetime

A results panel can report its width through `ResizeObserver`. The browser observer has a resource
lifetime that must end when the view ends:

```ts
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";

// Adapt only the browser subscription; rendering stays in the template.
const widths = (element: HTMLElement) => Fx.callback<number>((emit) => {
  const observer = new ResizeObserver(([entry]) => {
    if (entry) emit.succeed(entry.contentRect.width);
  });
  observer.observe(element);
  return Effect.sync(() => observer.disconnect());
});

export const results = Fx.gen(function* () {
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

## Use hydration refs for state that crosses the response boundary

An ordinary callback cannot run on a server without its browser element and produces no HTML
representation. `RefSubject.hydrate` deliberately adds another capability: its result is both state
and a callable `HydrationRef` that can serialize state on a designated host.

```ts
import { Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";

export const SearchState = component(function* () {
  const query = yield* RefSubject.hydrate(Schema.String, "scope");
  return html`<section ref=${query}><output>Query: ${query}</output></section>`;
});
```

The HTML target writes the encoded state at this ref host. During adoption the DOM target restores
it before ordinary reactive parts begin and removes the consumed unnamed envelope. The state remains
a RefSubject; the ref identifies its server-to-browser handoff point.

When several refs share an element, combine them with `hydrateAll`:

```ts
import { Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";

export const SearchPreferences = component(function* () {
  const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 1, { name: "page" });
  const query = yield* RefSubject.hydrate(Schema.String, "scope");
  return html`<section ref=${RefSubject.hydrateAll(page, query)}>
    <output>Page ${page}; query ${query}</output>
  </section>`;
});
```

Named members use their `data-*` attributes; unnamed members share a versioned envelope. Duplicate
named attributes are a configuration error. Codec failures and required services remain typed.
Static HTML rendering omits hydration metadata entirely.

## Test the resource and the handoff you actually depend on

For the observer, count acquisition/finalization across fresh render, keyed removal, and spread-ref
removal. Assert the callback receives the expected native object. For hydrated state, assert both
the decoded value and adopted node identity; valid state and compatible DOM are separate checks.

Continue with [Hydrating Typed HTML](/explore/hydrating-typed-html) for adoption diagnosis and
[Hydrated template state](/explore/refsubject-template-hydration) for schema/envelope behavior.
